import { existsSync } from 'node:fs'
import {
  DEFAULT_JD_COMMAND_VAULT_PATH,
  isJdCommandVaultRow,
  vaultRowScanPath,
} from '@/lib/vault/constants'
import { isPrivateJysonEnabled } from '@/lib/openjarvis/load-bridge'

export type FounderVaultPathSource = 'vault_row' | 'default' | 'disabled' | 'missing'

/** Local-only vault intelligence (founder machine + Private JYSON). */
export function isVaultIntelligenceEnabled(): boolean {
  return isPrivateJysonEnabled()
}

/**
 * Resolve JD Command Vault path: Supabase vault row local_path, else canonical default.
 * Caller must pass vault rows from listVaults() when available.
 */
export function resolveFounderVaultPathFromRows(
  vaults: Array<{ name: string | null; local_path: string | null }>,
): { path: string | null; source: FounderVaultPathSource } {
  if (!isVaultIntelligenceEnabled()) {
    return { path: null, source: 'disabled' }
  }

  const jdRow = vaults.find((v) => isJdCommandVaultRow(v.local_path, v.name))
  if (jdRow) {
    const scanPath = vaultRowScanPath(jdRow.local_path)
    if (scanPath && existsSync(scanPath)) {
      return { path: scanPath, source: 'vault_row' }
    }
  }

  if (existsSync(DEFAULT_JD_COMMAND_VAULT_PATH)) {
    return { path: DEFAULT_JD_COMMAND_VAULT_PATH, source: 'default' }
  }

  return { path: null, source: 'missing' }
}

export function resolveFounderVaultPathSync(
  vaultPathOverride?: string,
  options?: { requirePrivateJyson?: boolean },
): { path: string | null; source: FounderVaultPathSource } {
  const requirePrivate = options?.requirePrivateJyson ?? true
  if (requirePrivate && !isVaultIntelligenceEnabled()) {
    return { path: null, source: 'disabled' }
  }

  const trimmed = vaultPathOverride?.trim()
  if (trimmed) {
    const scanPath = vaultRowScanPath(trimmed) ?? trimmed
    if (existsSync(scanPath)) return { path: scanPath, source: 'vault_row' }
  }

  if (existsSync(DEFAULT_JD_COMMAND_VAULT_PATH)) {
    return { path: DEFAULT_JD_COMMAND_VAULT_PATH, source: 'default' }
  }

  return { path: null, source: 'missing' }
}
