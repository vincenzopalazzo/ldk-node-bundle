import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => ({
  bitcoind: {
    // A Lightning node needs a synced chain: fee estimates and channel funding both depend
    // on it.
    healthChecks: ['bitcoind', 'sync-progress'],
    kind: 'running',
    // Publishes the rpc-local host that main.ts dials.
    versionRange: '>=31.1:17',
  },
}))
