import { existsSync } from 'node:fs'
import {
  DEFAULT_JD_COMMAND_VAULT_PATH,
  isJdCommandVaultRow,
  vaultRowScanPath,
} from '@/lib/vault/constants'
import { isPrivateJysonEnabled } from '@/lib/openjarvis/load-bridge'

export type FounderVaultPathSource = 'vault_row' | 'default' | 'disabled' | 'missing'

export type ResolvedJdCommandVault = {
  vaultId: string | null
  path: string | null
  source: FounderVaultPathSource
  name: string | null
}

type VaultRowLike = {
  id?: string
  name: string | null
  local_path: string | null
}

/**
 * Vault excerpt Q&A: enabled for founder private JYSON (local) and production cloud index.
 */
export function isVaultIntelligenceEnabled(): boolean {
  if (isPrivateJysonEnabled()) return true
  if (process.env.VERCEL === '1') return true
  return false
}

/** @deprecated Use resolveJdCommandVaultFromRows — kept for callers expecting path-only. */
export function resolveFounderVaultPathFromRows(
  vaults: VaultRowLike[],
): { path: string | null; source: FounderVaultPathSource } {
  const resolved = resolveJdCommandVaultFromRows(vaults)
  return { path: resolved.path, source: resolved.source }
}

/**
 * Resolve JD Command Vault: Supabase row (id + local_path), else canonical default on disk.
 * On Vercel, returns vaultId from row even when local path is unavailable on the host.
 */
export function resolveJdCommandVaultFromRows(vaults: VaultRowLike[]): ResolvedJdCommandVault {
  if (!isVaultIntelligenceEnabled()) {
    return { vaultId: null, path: null, source: 'disabled', name: null }
  }

  const jdRow = vaults.find((v) => isJdCommandVaultRow(v.local_path, v.name))
  if (jdRow) {
    const scanPath = vaultRowScanPath(jdRow.local_path)
    const onDisk = scanPath && existsSync(scanPath)
    if (onDisk) {
      return {
        vaultId: jdRow.id ?? null,
        path: scanPath,
        source: 'vault_row',
        name: jdRow.name,
      }
    }
    if (process.env.VERCEL === '1' && jdRow.id) {
      return {
        vaultId: jdRow.id,
        path: scanPath,
        source: 'vault_row',
        name: jdRow.name,
      }
    }
  }

  if (existsSync(DEFAULT_JD_COMMAND_VAULT_PATH)) {
    return {
      vaultId: jdRow?.id ?? null,
      path: DEFAULT_JD_COMMAND_VAULT_PATH,
      source: 'default',
      name: jdRow?.name ?? 'JD Command Vault',
    }
  }

  return { vaultId: jdRow?.id ?? null, path: null, source: 'missing', name: jdRow?.name ?? null }
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
