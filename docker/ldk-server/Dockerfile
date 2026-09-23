# syntax=docker/dockerfile:1.7
#
# ldk-server and ldk-server-mcp as two minimal images, built from upstream source.
#
#   docker build --target ldk-server     -t ldk-server     docker/ldk-server
#   docker build --target ldk-server-mcp -t ldk-server-mcp docker/ldk-server
#
# Each is one fully static (musl) binary on an empty image, plus a CA bundle. There is no
# shell: run the CLI or debug from another container. Upstream publishes no image and its own
# Dockerfile (debian-slim) does not build the MCP server, hence this file.
#
# Built natively per architecture (tested on arm64; amd64 uses the same Alpine toolchain). Emulating
# a Rust build under QEMU is impractically slow, so CI should use a runner of each architecture.

ARG RUST_IMAGE=rust:1.97-alpine3.22

# Upstream commit to build. Bump deliberately: it is the node you run.
ARG LDK_SERVER_REV=dbe22c574bd2c7040d82f2c27e480968e15c8a1d

# ---------------------------------------------------------------------------
# Toolchain and source
# ---------------------------------------------------------------------------
FROM ${RUST_IMAGE} AS toolchain
# Native dependencies, all linked statically: OpenSSL (ldk-node's PostgreSQL TLS), AWS-LC
# (rustls), and SQLite (bundled by rusqlite).
RUN apk add --no-cache musl-dev openssl-dev openssl-libs-static perl make cmake clang linux-headers ca-certificates file

FROM toolchain AS source
ARG LDK_SERVER_REV
ADD --keep-git-dir=false https://github.com/lightningdevkit/ldk-server.git#${LDK_SERVER_REV} /src

FROM source AS build-base
WORKDIR /src
ARG LDK_SERVER_REV
# `env!("GIT_HASH")` in upstream code: the version string needs it at compile time.
ENV GIT_HASH=${LDK_SERVER_REV}
# Size over build speed: upstream's release profile already has fat LTO and panic=abort;
# add one codegen unit and stripped symbols.
ENV CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1 \
    CARGO_PROFILE_RELEASE_STRIP=symbols \
    OPENSSL_STATIC=1 \
    OPENSSL_NO_VENDOR=1 \
    CARGO_TERM_COLOR=never
RUN mkdir -p /out /empty /rootfs-tmp && chmod 1777 /rootfs-tmp

# ---------------------------------------------------------------------------
# Builds (separate, so each image only compiles what it ships)
# ---------------------------------------------------------------------------
FROM build-base AS build-server
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/src/target,id=ldk-server-target \
    cargo build --release --locked -p ldk-server \
    && cp target/release/ldk-server /out/ \
    && file /out/ldk-server | grep -Eq "static(-pie)? linked|statically linked"

FROM build-base AS build-mcp
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/src/target,id=ldk-server-mcp-target \
    cargo build --release --locked -p ldk-server-mcp \
    && cp target/release/ldk-server-mcp /out/ \
    && file /out/ldk-server-mcp | grep -Eq "static(-pie)? linked|statically linked"

# ---------------------------------------------------------------------------
# Runtime images
# ---------------------------------------------------------------------------
FROM scratch AS ldk-server
COPY --from=build-base /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=build-base --chmod=1777 /rootfs-tmp /tmp
COPY --from=build-base --chown=1000:1000 /empty /data
COPY --from=build-server /out/ldk-server /usr/local/bin/ldk-server
# Everything lives in /data: the mnemonic, TLS files, API key and channel database. Mount it.
# Logs go to stdout for the container runtime to keep; set LDK_SERVER_LOG_TO_FILE=true to
# also write them under /data.
ENV LDK_SERVER_STORAGE_DIR_PATH=/data \
    LDK_SERVER_NODE_GRPC_SERVICE_ADDRESS=0.0.0.0:3536 \
    LDK_SERVER_NODE_LISTENING_ADDRESSES=0.0.0.0:9735 \
    LDK_SERVER_LOG_TO_FILE=false \
    HOME=/data \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
USER 1000:1000
EXPOSE 9735 3536
# SIGTERM persists channel state before exit; give it time (e.g. stop_grace_period: 3m).
STOPSIGNAL SIGTERM
ENTRYPOINT ["/usr/local/bin/ldk-server"]

FROM scratch AS ldk-server-mcp
COPY --from=build-base /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=build-mcp /out/ldk-server-mcp /usr/local/bin/ldk-server-mcp
# Speaks MCP over stdio, so run it with stdin attached (`docker run -i`). Point it at the node:
#   LDK_BASE_URL=ldk-server:3536  LDK_API_KEY=<hex>  LDK_TLS_CERT_PATH=/ldk/tls.crt
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
USER 1000:1000
ENTRYPOINT ["/usr/local/bin/ldk-server-mcp"]
