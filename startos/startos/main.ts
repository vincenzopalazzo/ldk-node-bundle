import { FileHelper } from '@start9labs/start-sdk'
import { manifest as bitcoindManifest } from 'bitcoin-core-startos/startos/manifest'
import {
  rpcLocalHostId,
  rpcPortLocal,
  rpccookiefile,
} from 'bitcoin-core-startos/startos/utils'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  adminUser,
  appUid,
  gatewayPort,
  grpcPort,
  grpcWebPort,
  peerPort,
  uiPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting LDK Node'))

  // The Set Admin Password task blocks the first start; this only guards against a store
  // that lost the hash, because without it the dashboard would be open to the network.
  const adminHash = await storeJson.read((s) => s.adminHash).const(effects)
  if (!adminHash) {
    return waiting(effects, i18n('Run the Set Admin Password action first.'))
  }

  // bitcoind's own RPC listener over the LXC bridge. Null until Bitcoin publishes it;
  // .const() re-runs main when it appears or moves.
  const rpc = await sdk.host
    .getBridgeAddress(effects, {
      packageId: 'bitcoind',
      hostId: rpcLocalHostId,
      internalPort: rpcPortLocal,
    })
    .const()
  if (!rpc) return waiting(effects, i18n('Waiting for Bitcoin'))

  const ldkContainer = sdk.SubContainer.of(
    effects,
    { imageId: 'ldk-server' },
    sdk.Mounts.of()
      .mountVolume({
        volumeId: 'main',
        subpath: 'ldk',
        mountpoint: '/data',
        readonly: false,
      })
      .mountDependency<typeof bitcoindManifest>({
        dependencyId: 'bitcoind',
        volumeId: 'main',
        subpath: null,
        mountpoint: '/mnt/bitcoind',
        readonly: true,
      }),
    'ldk-server',
  )

  // RPC credentials come from bitcoind's cookie, which it rewrites on every start. Restart
  // only when a new cookie replaces the old one: an absent cookie just means bitcoind is down.
  const rootfs = await ldkContainer.rootfs
  const cookie = await FileHelper.string(
    `${rootfs}/mnt/bitcoind/${rpccookiefile}`,
  )
    .read(
      (c) => c.trim(),
      (prev, next) => next === null || prev === next,
    )
    .const(effects)
  const separator = cookie?.indexOf(':') ?? -1
  if (!cookie || separator < 1) {
    return waiting(effects, i18n('Waiting for Bitcoin'))
  }

  return (
    sdk.Daemons.of(effects)
      // StartOS mounts volumes root-owned; every image here runs as uid 1000.
      .addOneshot('chown', {
        subcontainer: sdk.SubContainer.of(
          effects,
          { imageId: 'web' },
          sdk.Mounts.of().mountVolume({
            volumeId: 'main',
            subpath: null,
            mountpoint: '/data',
            readonly: false,
          }),
          'chown',
        ),
        exec: {
          command: [
            'sh',
            '-c',
            `mkdir -p /data/ldk /data/goose && chown -R ${appUid}:${appUid} /data/ldk /data/goose`,
          ],
          user: 'root',
        },
        requires: [],
      })
      .addDaemon('ldk-server', {
        subcontainer: ldkContainer,
        exec: {
          command: sdk.useEntrypoint(),
          env: {
            LDK_SERVER_NODE_NETWORK: 'bitcoin',
            LDK_SERVER_STORAGE_DIR_PATH: '/data',
            LDK_SERVER_NODE_GRPC_SERVICE_ADDRESS: `127.0.0.1:${grpcPort}`,
            LDK_SERVER_NODE_LISTENING_ADDRESSES: `0.0.0.0:${peerPort}`,
            LDK_SERVER_BITCOIND_RPC_ADDRESS: rpc,
            LDK_SERVER_BITCOIND_RPC_USER: cookie.slice(0, separator),
            LDK_SERVER_BITCOIND_RPC_PASSWORD: cookie.slice(separator + 1),
          },
          // SIGTERM persists channel state before exiting; give it time.
          sigtermTimeout: 180_000,
        },
        ready: {
          display: i18n('Lightning Node'),
          // The first start creates the wallet and syncs to the chain tip before the API
          // listens.
          gracePeriod: 600_000,
          fn: () =>
            sdk.healthCheck.checkPortListening(effects, grpcPort, {
              successMessage: i18n('The node is running'),
              errorMessage: i18n('The node is not running'),
            }),
        },
        requires: ['chown'],
      })
      .addDaemon('grpc-web-bridge', {
        subcontainer: sdk.SubContainer.of(
          effects,
          { imageId: 'envoy' },
          sdk.Mounts.of()
            .mountAssets({
              subpath: 'envoy.yaml',
              mountpoint: '/etc/envoy/envoy.yaml',
              type: 'file',
            })
            .mountVolume({
              volumeId: 'main',
              subpath: 'ldk',
              mountpoint: '/ldk',
              readonly: true,
            }),
          'grpc-web-bridge',
        ),
        exec: { command: sdk.useEntrypoint() },
        ready: {
          display: null,
          fn: () =>
            sdk.healthCheck.checkPortListening(effects, grpcWebPort, {
              successMessage: i18n('The gRPC-Web bridge is ready'),
              errorMessage: i18n('The gRPC-Web bridge is not ready'),
            }),
        },
        // It trusts ldk-server's certificate, which exists once the API listens.
        requires: ['ldk-server'],
      })
      .addDaemon('goose-gateway', {
        subcontainer: sdk.SubContainer.of(
          effects,
          { imageId: 'goose-gateway' },
          sdk.Mounts.of().mountVolume({
            volumeId: 'main',
            subpath: 'goose',
            mountpoint: '/goose/config',
            readonly: false,
          }),
          'goose-gateway',
        ),
        exec: {
          command: sdk.useEntrypoint(),
          env: {
            GOOSE_GATEWAY_HOST: '127.0.0.1',
            GOOSE_GATEWAY_PORT: String(gatewayPort),
          },
        },
        ready: {
          display: i18n('Assistant Gateway'),
          fn: () =>
            sdk.healthCheck.checkPortListening(effects, gatewayPort, {
              successMessage: i18n('The assistant gateway is ready'),
              errorMessage: i18n('The assistant gateway is not ready'),
            }),
        },
        requires: ['chown'],
      })
      .addDaemon('web', {
        subcontainer: sdk.SubContainer.of(
          effects,
          { imageId: 'web' },
          sdk.Mounts.of().mountVolume({
            volumeId: 'main',
            subpath: 'ldk',
            mountpoint: '/ldk',
            readonly: true,
          }),
          'web',
        ),
        exec: {
          command: sdk.useEntrypoint(),
          // uid 1000 to read the node's api_key (0400) for /bundle.json; gid 0 for the
          // directories the nginx image keeps group-writable.
          user: `${appUid}:0`,
          env: {
            GRPC_WEB_UPSTREAM: `127.0.0.1:${grpcWebPort}`,
            GOOSE_GATEWAY_UPSTREAM: `127.0.0.1:${gatewayPort}`,
            // Both upstreams are IP literals, so no resolver lookups happen; this only has
            // to be a valid address for the resolver directive.
            NGINX_ENTRYPOINT_LOCAL_RESOLVERS: '',
            NGINX_LOCAL_RESOLVERS: '127.0.0.1',
            BUNDLE_API_KEY: 'true',
            AUTH_USER: adminUser,
            AUTH_HASH: adminHash,
          },
        },
        ready: {
          display: i18n('Web Interface'),
          fn: () =>
            sdk.healthCheck.checkPortListening(effects, uiPort, {
              successMessage: i18n('The web interface is ready'),
              errorMessage: i18n('The web interface is not ready'),
            }),
        },
        requires: ['grpc-web-bridge', 'goose-gateway'],
      })
  )
})

/** A service with nothing running yet, showing why. */
function waiting(
  effects: Parameters<typeof sdk.Daemons.of>[0],
  message: string,
) {
  return sdk.Daemons.of(effects).addHealthCheck('waiting', {
    ready: {
      display: i18n('Lightning Node'),
      fn: () => ({ result: 'loading', message }),
    },
    requires: [],
  })
}
