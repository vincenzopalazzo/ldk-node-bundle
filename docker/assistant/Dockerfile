# syntax=docker/dockerfile:1.7
#
# The dashboard's assistant: goose-gateway with ldk-server-mcp beside it, so the gateway can
# serve the node's own tools (GOOSE_GATEWAY_MCP_COMMAND). Both are static binaries on scratch;
# this only copies one into the other, so a multi-platform build needs no emulation.
#
#   docker build -t ldk-node-assistant docker/assistant
#
# ldk-server-mcp is started by the gateway with the gateway's environment. It needs:
#   - LDK_BASE_URL, the node's gRPC address (e.g. ldk-server:3536); the name must be in the
#     node's TLS certificate ([tls] hosts);
#   - the node's storage mounted read-only at $HOME/.ldk-server (/goose/.ldk-server), where it
#     reads <network>/api_key and tls.crt itself, so the key never goes into an environment
#     variable;
#   - for a network other than mainnet, the node's own config file: set
#     GOOSE_GATEWAY_MCP_COMMAND="/usr/local/bin/ldk-server-mcp --config /path/ldk-server.toml".
#
# The gateway does no approval of its own: anything that reaches it can call every tool,
# payments included. Serve it only behind a login.

# goose-gateway 0.3.0 is the first release that serves MCP tools.
ARG GOOSE_GATEWAY_IMAGE=ghcr.io/vincenzopalazzo/goose-gateway:0.3.0
ARG LDK_SERVER_MCP_IMAGE=ghcr.io/vincenzopalazzo/ldk-server-mcp:0.1.1

FROM ${LDK_SERVER_MCP_IMAGE} AS mcp

FROM ${GOOSE_GATEWAY_IMAGE}
COPY --from=mcp /usr/local/bin/ldk-server-mcp /usr/local/bin/ldk-server-mcp
ENV GOOSE_GATEWAY_MCP_COMMAND=/usr/local/bin/ldk-server-mcp
