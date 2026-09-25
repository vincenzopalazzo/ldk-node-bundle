# syntax=docker/dockerfile:1.7
#
# vss-server (https://github.com/lightningdevkit/vss-server), LDK's Versioned Storage Service:
# remote, versioned storage of a node's state, on top of PostgreSQL. One fully static (musl)
# binary on an empty image, plus a CA bundle; no shell.
#
#   docker build -t vss-server docker/vss-server
#
# Configure it with environment variables (upstream reads them over its config file, and needs
# none): VSS_PSQL_ADDRESS, VSS_PSQL_USERNAME and VSS_PSQL_PASSWORD at least; VSS_PSQL_TLS to
# reach PostgreSQL over TLS; VSS_PSQL_DEFAULT_DB and VSS_PSQL_VSS_DB to change the databases.
# Requests are authenticated by signature by default, or by JWT with VSS_JWT_RSA_PEM. Logs go
# to stderr.
#
# Built natively per architecture, like docker/ldk-server: compiling Rust under QEMU is slow.

ARG RUST_IMAGE=rust:1.97-alpine3.22

# Upstream commit to build (the v0.1.0-alpha.0 tag). It also names the published image
# (docker/upstream-version.sh). Keep it a full 40-character hash.
ARG VSS_SERVER_REV=88a5703496386465556d920dccf49512296c53d0

FROM ${RUST_IMAGE} AS build
# OpenSSL linked statically: native-tls (PostgreSQL over TLS) and JWT verification use it.
RUN apk add --no-cache musl-dev openssl-dev openssl-libs-static pkgconf perl make ca-certificates file
ARG VSS_SERVER_REV
ADD --keep-git-dir=false https://github.com/lightningdevkit/vss-server.git#${VSS_SERVER_REV} /src
WORKDIR /src
ENV OPENSSL_STATIC=1 \
    CARGO_PROFILE_RELEASE_CODEGEN_UNITS=1 \
    CARGO_PROFILE_RELEASE_STRIP=symbols
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/src/target \
    cargo build --locked --release --bin vss-server \
    && mkdir -p /out && cp target/release/vss-server /out/ \
    && file /out/vss-server | grep -q 'static' \
    && mkdir -p /rootfs-tmp

FROM scratch AS vss-server
COPY --from=build /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt
COPY --from=build --chmod=1777 /rootfs-tmp /tmp
COPY --from=build /out/vss-server /usr/local/bin/vss-server
# Upstream always writes a log file as well as stderr; /dev/null keeps the image read-only and
# leaves the logs to the container runtime. The database names default like upstream's sample
# config (it connects to `postgres` to create `vss`); without a config file they must be set.
ENV VSS_BIND_ADDRESS=0.0.0.0:8080 \
    VSS_PSQL_DEFAULT_DB=postgres \
    VSS_PSQL_VSS_DB=vss \
    VSS_LOG_FILE=/dev/null \
    VSS_LOG_LEVEL=info \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
USER 1000:1000
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/vss-server"]
