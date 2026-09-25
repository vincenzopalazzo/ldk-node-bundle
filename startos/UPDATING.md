# Updating the images

All four images are pinned by tag in `startos/manifest/index.ts`; bump them there and the
version in `startos/versions/current.ts` (`<ldk-server version>:<package revision>`, e.g. `0.1.0:0`).

- **ldk-server** — `ghcr.io/vincenzopalazzo/ldk-server`, built from a pinned upstream commit by
  this repository's `images` workflow on a `v*` tag, and tagged with that upstream version
  (`0.1.0-dbe22c5`, or the release once upstream tags one). See `docker/ldk-server/Dockerfile`.
  The package version is `<ldk-server version>:<revision>`; StartOS versions cannot carry a
  commit, so when only the commit changes, bump the revision and name the commit in the notes.
- **goose-gateway** — `ghcr.io/vincenzopalazzo/goose-gateway`, released from
  [vincenzopalazzo/goose-gateway](https://github.com/vincenzopalazzo/goose-gateway) tags.
- **web** — `ghcr.io/vincenzopalazzo/ldk-server-manager-web`, published with `docker/web/publish.sh`
  from the (private) dashboard repository.
- **envoy** — `envoyproxy/envoy:distroless-v1.37.<patch>`; take the latest patch of the pinned
  minor from Docker Hub.

After a bump: `npm run check`, `make`, then install on a StartOS box and sign in to the dashboard.
