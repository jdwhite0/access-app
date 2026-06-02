import type { VaultConnectionSummary } from '@/types/db'

export function deriveSyncStatus(
  vault: VaultConnectionSummary | null
): string | null {
  if (!vault) return null
  if (vault.lastSyncStatus) return vault.lastSyncStatus
  if (!vault.lastSyncAt) return 'never'
  return vault.status
}
