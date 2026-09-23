# ldk-node-bundle

Container images and packages for self-hosting an [LDK](https://lightningdevkit.org/) Lightning
node ([ldk-server](https://github.com/lightningdevkit/ldk-server)) with its dashboard and an AI
assistant ([goose-gateway](https://github.com/vincenzopalazzo/goose-gateway)).

## Images

Small, single-program images for amd64 and arm64, running as a non-root user:

| Image                                         | What                                   | Built from |
| --------------------------------------------- | -------------------------------------- | ---------- |
| `ghcr.io/vincenzopalazzo/ldk-server`          | the Lightning node                     | `docker/ldk-server`, upstream source at a pinned commit |
| `ghcr.io/vincenzopalazzo/ldk-server-mcp`      | ldk-server's MCP server (stdio)        | `docker/ldk-server` |
| `ghcr.io/vincenzopalazzo/goose-gateway`       | OpenAI-compatible gateway in front of goose | [goose-gateway](https://github.com/vincenzopalazzo/goose-gateway) |
| `ghcr.io/vincenzopalazzo/ldk-server-manager-web` | the dashboard and the stack's web entry point | the dashboard repository |

ldk-server and ldk-server-mcp are each one statically linked binary on an empty base image:
about 41 MB and 5 MB. Upstream publishes no image, and its own Dockerfile does not build the MCP
server.

```bash
docker build --target ldk-server     -t ldk-server     docker/ldk-server
docker build --target ldk-server-mcp -t ldk-server-mcp docker/ldk-server
```

Build natively for the machine's architecture; compiling Rust under QEMU emulation is very slow.

### Running ldk-server

- Mount a volume at `/data`: the seed (`keys_mnemonic`), TLS files, `<network>/api_key` and the
  channel database. Back up the seed; never restore an old channel database or run the same node
  twice.
- Settings are `LDK_SERVER_*` variables, except the chain backend when it is Esplora or Electrum
  and `[tls] hosts` (the name other containers dial), which need a config file passed as the first
  argument.
- Give it time to stop (`stop_grace_period: 3m`): SIGTERM persists channel state.

### Running ldk-server-mcp

It speaks MCP over stdio (`docker run -i`) and needs `LDK_BASE_URL`, `LDK_API_KEY` (hex) and
`LDK_TLS_CERT_PATH`.

### ldk-node-assistant

[`docker/assistant`](docker/assistant/Dockerfile): goose-gateway with ldk-server-mcp copied in,
so the gateway serves the node's own tools to the dashboard's assistant
(`GOOSE_GATEWAY_MCP_COMMAND`). ldk-server-mcp needs `LDK_BASE_URL` and the node's storage mounted
read-only at `/goose/.ldk-server`, where it reads the API key and certificate itself; for a network
other than mainnet, add `--config` with the node's own config file to the command. The gateway
does no approval of its own, so serve it only behind a login.

## Releases

Pushing a `v*` tag builds both images on a native amd64 and arm64 runner and publishes them to
ghcr.io as one multi-arch image each, tagged with the version (`0.1.0`, `0.1`); then
`ldk-node-assistant` is built from that release's ldk-server-mcp. Pull requests
that touch `docker/` only build.
