import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { adminUser } from '../utils'

export const setAdminPassword = sdk.Action.withoutInput(
  'set-admin-password',

  async ({ effects }) => ({
    name: i18n('Set Admin Password'),
    description: i18n(
      'Generate a new random password for the dashboard. Replaces any existing password.',
    ),
    warning: (await storeJson.read((s) => s.adminHash).const(effects))
      ? i18n('Replaces the current dashboard password.')
      : null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const password = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 24,
    })

    // nginx checks the password with crypt(3); hash it with the web image's own mkpasswd so
    // the format is the one nginx reads. Only the hash is stored.
    const adminHash = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'web' },
      null,
      'hash-password',
      async (sub) => {
        const res = await sub.execFail(
          ['mkpasswd', '-m', 'sha512', '-P', '0'],
          {
            input: password,
          },
        )
        return res.stdout.toString().trim()
      },
    )
    if (!adminHash.startsWith('$6$')) {
      throw new Error(`mkpasswd returned an unexpected hash format`)
    }
    await storeJson.merge(effects, { adminHash })

    return {
      version: '1',
      title: i18n('Dashboard Login'),
      message: i18n(
        'Sign in to the dashboard with these. The password is not stored; run this action again to replace it.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: adminUser,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
