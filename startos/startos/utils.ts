// Ports inside the service. The subcontainers share one network namespace, so the daemons
// reach each other on 127.0.0.1; only the web entry point and the peer port are bound as
// interfaces.

/** nginx: the dashboard, and the only way in to the node's API and the assistant. */
export const uiPort = 8080
/** Lightning peer connections. */
export const peerPort = 9735
/** ldk-server's gRPC API (HMAC-authenticated, TLS). Loopback only. */
export const grpcPort = 3536
/** Envoy, translating the dashboard's gRPC-Web to gRPC. Loopback only. */
export const grpcWebPort = 8081
/** goose-gateway. It has no login of its own, so loopback only, behind nginx's. */
export const gatewayPort = 8791

export const uiHostId = 'ui'
export const peerHostId = 'peer'

/** The dashboard's basic-auth user; the password comes from the Set Admin Password action. */
export const adminUser = 'admin'

/** The uid every image here runs as. */
export const appUid = '1000'
