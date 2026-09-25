import { setupManifest } from '@start9labs/start-sdk'
import { bitcoindDescription, long, short } from './i18n'

export const manifest = setupManifest({
  id: 'ldk-node',
  title: 'LDK Node',
  license: 'MIT',
  packageRepo: 'https://github.com/vincenzopalazzo/ldk-node-bundle',
  upstreamRepo: 'https://github.com/lightningdevkit/ldk-server',
  marketingUrl: 'https://lightningdevkit.org/',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    'ldk-server': {
      source: { dockerTag: 'ghcr.io/vincenzopalazzo/ldk-server:0.1.0-dbe22c5' },
      arch: ['x86_64', 'aarch64'],
    },
    envoy: {
      source: { dockerTag: 'envoyproxy/envoy:distroless-v1.37.6' },
      arch: ['x86_64', 'aarch64'],
    },
    'goose-gateway': {
      source: { dockerTag: 'ghcr.io/vincenzopalazzo/goose-gateway:0.2.2' },
      arch: ['x86_64', 'aarch64'],
    },
    web: {
      source: {
        dockerTag: 'ghcr.io/vincenzopalazzo/ldk-server-manager-web:0.1.0',
      },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {
    bitcoind: {
      description: bitcoindDescription,
      optional: false,
      metadata: {
        title: 'Bitcoin',
        icon: 'https://raw.githubusercontent.com/Start9Labs/bitcoin-core-startos/refs/heads/30.x/dep-icon.svg',
      },
    },
  },
})
