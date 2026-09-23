export const DEFAULT_LANG = 'en_US'

const dict = {
  'Set Admin Password': 0,
  'Generate a new random password for the dashboard. Replaces any existing password.': 1,
  'Replaces the current dashboard password.': 2,
  'Dashboard Login': 3,
  'Sign in to the dashboard with these. The password is not stored; run this action again to replace it.': 4,
  Username: 5,
  Password: 6,
  'Create the dashboard password before starting the node.': 7,
  Dashboard: 8,
  'Manage the node: channels, payments, the on-chain wallet and the assistant': 9,
  'Peer Interface': 10,
  'Lightning peers connect to the node here': 11,
  'Starting LDK Node': 12,
  'Run the Set Admin Password action first.': 13,
  'Waiting for Bitcoin': 14,
  'Lightning Node': 15,
  'The node is running': 16,
  'The node is not running': 17,
  'The gRPC-Web bridge is ready': 18,
  'The gRPC-Web bridge is not ready': 19,
  'Assistant Gateway': 20,
  'The assistant gateway is ready': 21,
  'The assistant gateway is not ready': 22,
  'Web Interface': 23,
  'The web interface is ready': 24,
  'The web interface is not ready': 25,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
