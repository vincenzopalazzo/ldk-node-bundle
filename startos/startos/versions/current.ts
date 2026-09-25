import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  // <ldk-server version>:<package revision>. Upstream has no release tags yet, so this is the
  // crate version; the image tag (0.1.0-dbe22c5) and the notes name the exact commit.
  version: '0.1.0:0',
  releaseNotes: {
    en_US:
      'First release: ldk-server 0.1.0 at upstream commit dbe22c5, with its dashboard and assistant gateway.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
