/**
 * Canonical monorepo root (macOS resolves JD_AI_System → JD_Ai_System).
 * Verify with: readlink -f …/Documents/JD_AI_System
 */
export const DEFAULT_JD_AI_SYSTEM_MONOREPO_ROOT =
  '/Users/jdproductions/Documents/JD_Ai_System'

/** Obsidian vault inside the monorepo (operator default). */
export const DEFAULT_JD_COMMAND_VAULT_PATH =
  `${DEFAULT_JD_AI_SYSTEM_MONOREPO_ROOT}/JD Command Vault`

/** Generated founder mirror output (connector-only writes here). */
export const FOUNDER_SYSTEM_MIRROR_DIR = 'system_mirror'

/** Pre-move sibling path under ~/Documents — auto-corrected on sync/register. */
export const LEGACY_JD_COMMAND_VAULT_PATH =
  '/Users/jdproductions/Documents/JD Command Vault'

export function resolveJdCommandVaultLocalPath(localPath: string): {
  scanPath: string
  migratedFrom: string | null
} {
  const trimmed = localPath.trim()
  if (trimmed === LEGACY_JD_COMMAND_VAULT_PATH) {
    return { scanPath: DEFAULT_JD_COMMAND_VAULT_PATH, migratedFrom: LEGACY_JD_COMMAND_VAULT_PATH }
  }
  return { scanPath: trimmed, migratedFrom: null }
}

/** Resolved scan path for a stored vault row, or null when empty. */
export function vaultRowScanPath(localPath: string | null | undefined): string | null {
  const trimmed = localPath?.trim()
  if (!trimmed) return null
  return resolveJdCommandVaultLocalPath(trimmed).scanPath
}

/** True when both paths refer to the same JD Command Vault on disk. */
export function areJdCommandVaultPathsEquivalent(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const scanA = vaultRowScanPath(a)
  const scanB = vaultRowScanPath(b)
  if (!scanA || !scanB) return false
  return scanA === scanB && scanA === DEFAULT_JD_COMMAND_VAULT_PATH
}

export function isJdCommandVaultRow(
  localPath: string | null | undefined,
  name?: string | null,
): boolean {
  if (vaultRowScanPath(localPath) === DEFAULT_JD_COMMAND_VAULT_PATH) return true
  return (name?.trim().toLowerCase() ?? '') === 'jd command vault'
}

export function terminalVaultRegisterHref(
  vaultName = 'JD Command Vault',
  vaultPath = DEFAULT_JD_COMMAND_VAULT_PATH,
  vaultType = 'obsidian',
): string {
  const params = new URLSearchParams({
    vault_name: vaultName,
    vault_type: vaultType,
    vault_path: vaultPath,
  })
  return `/terminal?${params.toString()}`
}

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
