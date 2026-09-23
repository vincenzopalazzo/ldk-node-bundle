import { sdk } from './sdk'

// The seed (ldk/keys_mnemonic), the node's API key and TLS files, the assistant's sign-ins
// and the admin password hash are backed up. The channel database is not: restoring an
// older copy of it and starting the node can broadcast revoked states and lose the funds
// in those channels. After a restore the node starts from the seed with no channels; its
// peers close them and the funds return on-chain to the seed's wallet.
export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) =>
    sdk.Backups.ofVolumes('main').setOptions({
      exclude: ['/ldk/*/ldk_node_data.sqlite'],
    }),
)
