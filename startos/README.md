# LDK Node for StartOS

A StartOS 0.4 package (start-sdk 2.0) that runs [ldk-server](https://github.com/lightningdevkit/ldk-server)
against the box's Bitcoin node, with the LDK Server Manager dashboard and the
[goose-gateway](https://github.com/vincenzopalazzo/goose-gateway) assistant in front of it.

## Build

Needs Node 22+, Docker and [`start-cli`](https://docs.start9.com/packaging/environment-setup.html).

```sh
npm ci
make          # ldk-node_x86_64.s9pk and ldk-node_aarch64.s9pk
npm run check # type-check only
```

`make` pulls the images named in `startos/manifest/index.ts`, so the web image
(`ghcr.io/vincenzopalazzo/ldk-server-manager-web`) must be public or the builder logged in to ghcr.io.

## How it runs

One `main` volume, five processes sharing the service's network namespace:

| Daemon            | Image                                       | Listens          | Mounts (volume `main`)                  |
| ----------------- | ------------------------------------------- | ---------------- | --------------------------------------- |
| `chown` (oneshot) | web                                         |                  | `/` at `/data`, as root                 |
| `ldk-server`      | `ghcr.io/vincenzopalazzo/ldk-server`        | 127.0.0.1:3536, 0.0.0.0:9735 | `ldk/` at `/data`; bitcoind's volume at `/mnt/bitcoind` (ro) |
| `grpc-web-bridge` | `envoyproxy/envoy` (distroless)             | 127.0.0.1:8081   | `ldk/` at `/ldk` (ro); `assets/envoy.yaml` |
| `goose-gateway`   | `ghcr.io/vincenzopalazzo/goose-gateway`     | 127.0.0.1:8791   | `goose/` at `/goose/config`             |
| `web`             | `ghcr.io/vincenzopalazzo/ldk-server-manager-web` | 0.0.0.0:8080 | `ldk/` at `/ldk` (ro)                   |

Only nginx (`web`, interface `ui`) and the peer port (interface `peer`) are bound as interfaces.
nginx serves the dashboard and proxies `/api.LightningNode/*` to Envoy and `/goose/*` to the
gateway, so the browser talks to one origin. The gateway has no login of its own; it is
reachable only through nginx.

- **Bitcoin.** `main.ts` dials bitcoind's `rpc-local` host over the LXC bridge and reads the RPC
  credentials from bitcoind's `.cookie`, passing them to ldk-server as
  `LDK_SERVER_BITCOIND_RPC_USER`/`_PASSWORD`. A new cookie (bitcoind restarted) restarts the
  service. The dependency requires Bitcoin to be running and synced.
- **Network.** Mainnet only (`LDK_SERVER_NODE_NETWORK=bitcoin`), matching Bitcoin on StartOS.
- **Login.** nginx basic auth, user `admin`. The *Set Admin Password* action generates a password,
  hashes it with the web image's `mkpasswd -m sha512` and stores only the `$6$` hash in
  `store.json`; nginx checks it with crypt(3). A critical task asks for it on install, and
  `main.ts` refuses to start the dashboard without it.
- **Auto-connect.** With the login in place the web image serves `/bundle.json`, which carries
  the node's API key, so the dashboard connects without the user pasting it.
- **Shutdown.** ldk-server gets 3 minutes after SIGTERM to persist channel state.

## Backups

`main` is backed up except `ldk/*/ldk_node_data.sqlite`, the channel database. Kept: the seed
(`ldk/keys_mnemonic`), the API key and TLS files, the assistant's sign-ins (`goose/`) and the
admin hash. Restoring an older channel database and starting the node can broadcast revoked
states and lose those channels' funds, and StartOS backups are periodic, so a restored node
starts from the seed with no channel state. It keeps its on-chain wallet but cannot claim or
defend the channels it had, so their balances may be lost: close channels before relying on a
restore (moving boxes, replacing a disk). See the repository README for the same policy on
Compose and umbrelOS.

## Not included yet

- Tor: no SOCKS proxy is configured, so the node cannot dial `.onion` peers, and it announces no
  address.
- `ldk-server-mcp`: the assistant answers from the chat model alone; the MCP tools are not wired
  into the gateway.
- Configuration actions (alias, announcement addresses, LSPs).
