export const JD_AI_SYSTEM_VAULT_KEY = 'JD_AI_System'

export const JD_AI_SYSTEM_VAULT_DISPLAY_NAME = 'JD_AI_System Intelligence Vault'

export const VAULT_CONNECTOR_TYPE_LOCAL = 'local_connector'

/** Handles that auto-provision the JD_AI_System vault connection (Phase 3a). */
export function getVaultSeedHandles(): string[] {
  const fromEnv = process.env.ACCESS_VAULT_SEED_HANDLES
  if (fromEnv?.trim()) {
    return fromEnv.split(',').map((h) => h.trim()).filter(Boolean)
  }
  return ['jerry.access', 'jdwhite.access']
}

export type VaultConnectionStatus =
  | 'pending_connector'
  | 'connected'
  | 'syncing'
  | 'error'
  | 'revoked'
