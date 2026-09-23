import { i18n } from './i18n'
import { sdk } from './sdk'
import { peerHostId, peerPort, uiHostId, uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // The dashboard. nginx serves it and proxies the node's API and the assistant under the
  // same origin, behind its own login (Set Admin Password).
  const uiMulti = sdk.MultiHost.of(effects, uiHostId)
  const uiMultiOrigin = await uiMulti.bindPort(uiPort, { protocol: 'http' })
  const ui = sdk.createInterface(effects, {
    name: i18n('Dashboard'),
    id: 'ui',
    description: i18n(
      'Manage the node: channels, payments, the on-chain wallet and the assistant',
    ),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  // Lightning peers.
  const peerMulti = sdk.MultiHost.of(effects, peerHostId)
  const peerMultiOrigin = await peerMulti.bindPort(peerPort, {
    protocol: null,
    addSsl: null,
    preferredExternalPort: peerPort,
    secure: { ssl: false },
  })
  const peer = sdk.createInterface(effects, {
    name: i18n('Peer Interface'),
    id: 'peer',
    description: i18n('Lightning peers connect to the node here'),
    type: 'p2p',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [
    await uiMultiOrigin.export([ui]),
    await peerMultiOrigin.export([peer]),
  ]
})
