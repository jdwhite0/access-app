'use server'

import { listVaults } from '@/lib/actions/vaults'
import { resolveJdCommandVaultFromRows } from '@/lib/jyson/resolve-founder-vault-path'
import { createSupabaseAdmin } from '@/lib/supabase'
import { countVaultChunksForVault } from '@/lib/vault/vault-chunks-store'

export type CloudVaultReadySnapshot = {
  ready: boolean
  vaultCount: number
  chunkCount: number
  hasSyncedVault: boolean
}

/**
 * True when the user has vault context in ACCESS cloud (indexed chunks or a synced vault row).
 * Used to unlock JYSON companion without blocking on blueprint export or local Founder OS.
 */
export async function getCloudVaultReadySnapshot(
  clerkUserId: string,
): Promise<CloudVaultReadySnapshot> {
  const vaults = await listVaults().catch(() => [])
  const hasSyncedVault = vaults.some(
    (v) =>
      v.status === 'connected' ||
      (!!v.last_synced_at && (v.file_count ?? 0) > 0),
  )

  const resolved = resolveJdCommandVaultFromRows(vaults)
  const supabase = createSupabaseAdmin()

  if (!supabase || !resolved.vaultId) {
    return {
      ready: hasSyncedVault,
      vaultCount: vaults.length,
      chunkCount: 0,
      hasSyncedVault,
    }
  }

  const chunkCount = await countVaultChunksForVault(supabase, resolved.vaultId, clerkUserId)
  return {
    ready: chunkCount > 0 || hasSyncedVault,
    vaultCount: vaults.length,
    chunkCount,
    hasSyncedVault,
  }
}
