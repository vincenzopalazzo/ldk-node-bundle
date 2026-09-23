import { setAdminPassword } from '../actions/setAdminPassword'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// The dashboard hands out control of the node, so it never starts without a login.
export const watchCredentials = sdk.setupOnInit(async (effects) => {
  const adminHash = await storeJson.read((s) => s.adminHash).const(effects)
  if (!adminHash) {
    await sdk.action.createOwnTask(effects, setAdminPassword, 'critical', {
      reason: i18n('Create the dashboard password before starting the node.'),
    })
  }
})
