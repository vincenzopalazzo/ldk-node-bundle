import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const storeJson = FileHelper.json(
  {
    base: sdk.volumes.main,
    subpath: '/store.json',
  },
  z.object({
    // crypt(3) SHA-512 hash of the admin password; the password itself is never stored.
    adminHash: z.string().optional().catch(undefined),
  }),
)
