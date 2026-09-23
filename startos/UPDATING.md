# Updating the images

All four images are pinned by tag in `startos/manifest/index.ts`; bump them there and the
version in `startos/versions/current.ts` (`<ldk-server image version>:<package revision>`).

- **ldk-server** — `ghcr.io/vincenzopalazzo/ldk-server`, built from a pinned upstream commit by
  this repository's `images` workflow on a `v*` tag. See `docker/ldk-server/Dockerfile`.
- **goose-gateway** — `ghcr.io/vincenzopalazzo/goose-gateway`, released from
  [vincenzopalazzo/goose-gateway](https://github.com/vincenzopalazzo/goose-gateway) tags.
- **web** — `ghcr.io/vincenzopalazzo/ldk-server-manager-web`, published with `docker/web/publish.sh`
  from the (private) dashboard repository.
- **envoy** — `envoyproxy/envoy:distroless-v1.37.<patch>`; take the latest patch of the pinned
  minor from Docker Hub.

After a bump: `npm run check`, `make`, then install on a StartOS box and sign in to the dashboard.
