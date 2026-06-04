import type { SupabaseClient } from '@supabase/supabase-js'
import { DEFAULT_JD_COMMAND_VAULT_PATH } from '@/lib/vault/constants'
import { scanVaultLocalPath } from '@/lib/vault/scan-local-path'

export type ConnectorVaultResyncInput = {
  clerkUserId: string
  fileCount?: number
  truncated?: boolean
  localPath?: string
}

export type ConnectorVaultResyncResult = {
  ok: boolean
  error: string | null
  fileCount: number
  lastSyncedAt: string | null
  vaultsUpdated: number
  vaultConnectionsUpdated: number
}

/** Apply vault scan counts after connector mirror/scan (device JWT route). */
export async function applyConnectorVaultResync(
  supabase: SupabaseClient,
  input: ConnectorVaultResyncInput,
): Promise<ConnectorVaultResyncResult> {
  const scanPath = (input.localPath?.trim() || process.env.ACCESS_VAULT_ROOT?.trim() || DEFAULT_JD_COMMAND_VAULT_PATH).trim()
  const lastSyncedAt = new Date().toISOString()

  let fileCount = input.fileCount
  let truncated = input.truncated ?? false

  if (fileCount === undefined) {
    const scan = await scanVaultLocalPath(scanPath)
    if (!scan.ok) {
      return {
        ok: false,
        error: scan.error ?? 'Vault scan failed',
        fileCount: 0,
        lastSyncedAt: null,
        vaultsUpdated: 0,
        vaultConnectionsUpdated: 0,
      }
    }
    fileCount = scan.fileCount
    truncated = scan.truncated
  }

  const { data: existingVaults, error: listErr } = await supabase
    .from('vaults')
    .select('id, local_path')
    .eq('clerk_user_id', input.clerkUserId)

  if (listErr) {
    return {
      ok: false,
      error: listErr.message,
      fileCount,
      lastSyncedAt: null,
      vaultsUpdated: 0,
      vaultConnectionsUpdated: 0,
    }
  }

  const vaultIds = (existingVaults ?? [])
    .filter(
      (v) =>
        v.local_path === scanPath ||
        (v.local_path?.includes('JD Command Vault') ?? false),
    )
    .map((v) => v.id)

  let vaultRows: { id: string }[] | null = null
  if (vaultIds.length > 0) {
    const { data, error: vaultErr } = await supabase
      .from('vaults')
      .update({
        file_count: fileCount,
        last_synced_at: lastSyncedAt,
        status: 'connected',
        updated_at: lastSyncedAt,
      })
      .in('id', vaultIds)
      .select('id')

    if (vaultErr) {
      return {
        ok: false,
        error: vaultErr.message,
        fileCount,
        lastSyncedAt: null,
        vaultsUpdated: 0,
        vaultConnectionsUpdated: 0,
      }
    }
    vaultRows = data
  }

  const { data: vcRows, error: vcErr } = await supabase
    .from('vault_connections')
    .update({
      status: 'connected',
      last_seen_at: lastSyncedAt,
      last_sync_at: lastSyncedAt,
      last_sync_status: 'connected',
    })
    .eq('clerk_user_id', input.clerkUserId)
    .select('id')

  if (vcErr) {
    return {
      ok: false,
      error: vcErr.message,
      fileCount,
      lastSyncedAt,
      vaultsUpdated: vaultRows?.length ?? 0,
      vaultConnectionsUpdated: 0,
    }
  }

  return {
    ok: true,
    error: truncated ? 'Scan truncated at file limit' : null,
    fileCount,
    lastSyncedAt,
    vaultsUpdated: vaultRows?.length ?? 0,
    vaultConnectionsUpdated: vcRows?.length ?? 0,
  }
}
