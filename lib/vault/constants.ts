export const JD_AI_SYSTEM_VAULT_KEY = 'JD_AI_System'

export const JD_AI_SYSTEM_VAULT_DISPLAY_NAME = 'JD_AI_System Intelligence Vault'

export const VAULT_CONNECTOR_TYPE_LOCAL = 'local_connector'

export const VAULT_TYPE_LOCAL_INTELLIGENCE = 'local_intelligence_vault'

export type VaultConnectionStatus =
  | 'pending_connector'
  | 'connected'
  | 'syncing'
  | 'stale'
  | 'disconnected'
  | 'revoked'
  | 'error'

export const VAULT_CONNECTION_ACTIVE_STATUSES: VaultConnectionStatus[] = [
  'connected',
  'pending_connector',
  'syncing',
  'stale',
]
