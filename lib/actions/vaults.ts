'use server'

import { existsSync } from 'fs'
import { auth } from '@clerk/nextjs/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAdmin } from '@/lib/supabase'
import { isConnectorOnlineForClerkUser } from '@/lib/connector/connector-online'
import {
  DEFAULT_JD_COMMAND_VAULT_PATH,
  areJdCommandVaultPathsEquivalent,
  isJdCommandVaultRow,
  resolveJdCommandVaultLocalPath,
  vaultRowScanPath,
} from '@/lib/vault/constants'
import { scanVaultLocalPath } from '@/lib/vault/scan-local-path'
import { replaceVaultFileMetadata } from '@/lib/vault/vault-files-store'
import type { Vault, VaultStatus, VaultType } from '@/types/db'

// ── Helpers ──────────────────────────────────────────────────────────────────

function missingTable(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false
  return err.code === '42P01' || err.code === 'PGRST205' || !!err.message?.includes('vaults')
}

function resolveOwnerHandle(userId: string): string {
  return userId.slice(0, 12)
}

function jdCommandVaultKeeperScore(vault: Vault): number {
  let score = 0
  if (vault.local_path === DEFAULT_JD_COMMAND_VAULT_PATH) score += 1000
  if (vault.local_path && existsSync(vault.local_path)) score += 500
  if (vault.last_synced_at) score += 100
  score += vault.file_count ?? 0
  return score
}

function pickJdCommandVaultKeeper(candidates: Vault[]): Vault {
  return [...candidates].sort((a, b) => {
    const diff = jdCommandVaultKeeperScore(b) - jdCommandVaultKeeperScore(a)
    if (diff !== 0) return diff
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })[0]
}

/** Archive duplicate JD Command Vault rows (legacy Documents path vs in-repo canonical). */
async function dedupeJdCommandVaultRows(
  supabase: SupabaseClient,
  userId: string,
  vaults: Vault[],
): Promise<Vault[]> {
  const group = vaults.filter((v) => isJdCommandVaultRow(v.local_path, v.name))
  if (group.length <= 1) return vaults

  const keeper = pickJdCommandVaultKeeper(group)
  const archiveIds = group.filter((v) => v.id !== keeper.id).map((v) => v.id)
  if (archiveIds.length === 0) return vaults

  const updated_at = new Date().toISOString()
  await supabase
    .from('vaults')
    .update({ status: 'archived', updated_at })
    .eq('clerk_user_id', userId)
    .in('id', archiveIds)

  return vaults.filter((v) => !archiveIds.includes(v.id))
}

export type VaultSyncRequestResult = {
  status: 'synced' | 'connector_offline' | 'not_found' | 'error'
  message: string
  file_count?: number
  last_synced_at?: string
  vault?: Vault
}

// ── Read ─────────────────────────────────────────────────────────────────────

export async function listVaults(): Promise<Vault[]> {
  const { userId } = await auth()
  if (!userId) return []
  const supabase = createSupabaseAdmin()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('vaults')
    .select('*')
    .eq('clerk_user_id', userId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
  if (missingTable(error)) return []
  const vaults = (data ?? []) as Vault[]
  return dedupeJdCommandVaultRows(supabase, userId, vaults)
}

export async function getVault(id: string): Promise<Vault | null> {
  const { userId } = await auth()
  if (!userId) return null
  const supabase = createSupabaseAdmin()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('vaults')
    .select('*')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .single()
  if (error || !data) return null
  return data as Vault
}

// ── Create ────────────────────────────────────────────────────────────────────

/** Simple creation (legacy). */
export async function createVault(
  ownerHandle: string,
  name: string,
  description: string,
  vaultType?: VaultType
): Promise<Vault | null> {
  const { userId } = await auth()
  if (!userId) return null
  const supabase = createSupabaseAdmin()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('vaults')
    .insert({ clerk_user_id: userId, owner_handle: ownerHandle, name, description: description || null, vault_type: vaultType ?? null })
    .select('*')
    .single()
  if (error) return null
  return data as Vault
}

/** Full registration — includes local_path, description, type. */
export async function registerVaultWithPath(input: {
  name: string
  vault_type: VaultType
  local_path: string
  description?: string
}): Promise<{ vault: Vault | null; error: string | null }> {
  const { userId } = await auth()
  if (!userId) return { vault: null, error: 'Not authenticated' }
  if (!input.name.trim()) return { vault: null, error: 'Name is required' }
  if (!input.local_path.trim()) return { vault: null, error: 'Local path is required' }

  const supabase = createSupabaseAdmin()
  if (!supabase) return { vault: null, error: 'Database unavailable' }

  const owner_handle = resolveOwnerHandle(userId)
  const { scanPath: local_path } = resolveJdCommandVaultLocalPath(input.local_path)

  const { data: existingRows, error: existingError } = await supabase
    .from('vaults')
    .select('*')
    .eq('clerk_user_id', userId)
    .neq('status', 'archived')

  if (existingError) return { vault: null, error: existingError.message }

  const duplicate = (existingRows ?? []).find((row) => {
    const rowScan = vaultRowScanPath((row as Vault).local_path)
    if (rowScan && rowScan === local_path) return true
    if (isJdCommandVaultRow(local_path, input.name) && isJdCommandVaultRow((row as Vault).local_path, (row as Vault).name)) {
      return areJdCommandVaultPathsEquivalent((row as Vault).local_path, local_path)
    }
    return false
  }) as Vault | undefined

  if (duplicate) {
    if (duplicate.local_path !== local_path && local_path === DEFAULT_JD_COMMAND_VAULT_PATH) {
      const { vault: migrated } = await updateVaultLocalPath(duplicate.id, local_path)
      return { vault: migrated ?? duplicate, error: null }
    }
    return {
      vault: duplicate,
      error: null,
    }
  }

  const { data, error } = await supabase
    .from('vaults')
    .insert({
      clerk_user_id: userId,
      owner_handle,
      name: input.name.trim(),
      vault_type: input.vault_type,
      local_path,
      description: input.description?.trim() ?? null,
      status: 'pending_sync',
      file_count: 0,
    })
    .select('*')
    .single()

  if (error) return { vault: null, error: error.message }
  return { vault: data as Vault, error: null }
}

// ── Update ────────────────────────────────────────────────────────────────────

/** Called after a successful local vault scan. */
export async function updateVaultSyncStatus(
  id: string,
  fileCount: number,
  options?: { status?: VaultStatus },
): Promise<Vault | null> {
  const { userId } = await auth()
  if (!userId) return null
  const supabase = createSupabaseAdmin()
  if (!supabase) return null

  const last_synced_at = new Date().toISOString()
  const { data, error } = await supabase
    .from('vaults')
    .update({
      file_count: fileCount,
      last_synced_at,
      status: options?.status ?? 'connected',
      updated_at: last_synced_at,
    })
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .select('*')
    .single()

  if (error || !data) return null
  return data as Vault
}

/** Update stored local_path (e.g. legacy Documents sibling → repo path). */
export async function updateVaultLocalPath(
  id: string,
  localPath: string,
): Promise<{ vault: Vault | null; error: string | null }> {
  const { userId } = await auth()
  if (!userId) return { vault: null, error: 'Not authenticated' }

  const trimmed = localPath.trim()
  if (!trimmed) return { vault: null, error: 'Local path is required' }

  const supabase = createSupabaseAdmin()
  if (!supabase) return { vault: null, error: 'Database unavailable' }

  const updated_at = new Date().toISOString()
  const { data, error } = await supabase
    .from('vaults')
    .update({ local_path: trimmed, updated_at })
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .select('*')
    .single()

  if (error) return { vault: null, error: error.message }
  return { vault: data as Vault, error: null }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function disconnectVault(id: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const supabase = createSupabaseAdmin()
  if (!supabase) return false
  const { error } = await supabase
    .from('vaults')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('clerk_user_id', userId)
    .eq('id', id)
  return !error
}

/** Legacy alias */
export const deleteVault = disconnectVault

// ── Sync ──────────────────────────────────────────────────────────────────────

/**
 * Sync a registered vault: verify connector heartbeat, scan local_path on this machine,
 * update vault counts/timestamps, and optionally persist file metadata rows.
 */
const SYNC_LOG = '[requestVaultSync]'

export async function requestVaultSync(vaultId: string): Promise<VaultSyncRequestResult> {
  console.error(`${SYNC_LOG} start vaultId=${vaultId}`)

  try {
    const { userId } = await auth()
    if (!userId) {
      console.error(`${SYNC_LOG} auth: not authenticated`)
      return { status: 'error', message: 'Not authenticated' }
    }
    console.error(`${SYNC_LOG} auth: ok clerkUserId=${userId.slice(0, 8)}…`)

    const vault = await getVault(vaultId)
    if (!vault) {
      console.error(`${SYNC_LOG} vault lookup: not_found vaultId=${vaultId}`)
      return { status: 'not_found', message: 'Vault not found' }
    }
    console.error(
      `${SYNC_LOG} vault lookup: ok name=${vault.name} local_path=${vault.local_path ?? '(none)'}`,
    )

    if (!vault.local_path?.trim()) {
      console.error(`${SYNC_LOG} path validation: missing local_path`)
      return { status: 'error', message: 'No local path set for this vault' }
    }

    const { scanPath, migratedFrom } = resolveJdCommandVaultLocalPath(vault.local_path)
    let activeVault = vault
    if (migratedFrom) {
      console.error(`${SYNC_LOG} path migrate: ${migratedFrom} -> ${scanPath}`)
      const { vault: fixed, error: pathErr } = await updateVaultLocalPath(vaultId, scanPath)
      if (pathErr || !fixed) {
        console.error(`${SYNC_LOG} path migrate: failed error=${pathErr ?? 'unknown'}`)
        return {
          status: 'error',
          message: `Could not update vault path to ${scanPath}: ${pathErr ?? 'update failed'}`,
        }
      }
      activeVault = fixed
    }

    const supabase = createSupabaseAdmin()
    if (!supabase) {
      console.error(`${SYNC_LOG} supabase: admin client unavailable`)
      return { status: 'error', message: 'Database unavailable' }
    }

    const connector = await isConnectorOnlineForClerkUser(supabase, userId)
    console.error(
      `${SYNC_LOG} connector: online=${connector.online} lastSeenAt=${connector.lastSeenAt ?? 'null'} deviceId=${connector.deviceId ?? 'null'}`,
    )
    if (!connector.online) {
      return {
        status: 'connector_offline',
        message:
          'Connector is offline or unreachable. Run npm run connector:heartbeat from access-app, then try again.',
      }
    }

    console.error(`${SYNC_LOG} scan: start path=${scanPath}`)
    const scan = await scanVaultLocalPath(scanPath)
    if (!scan.ok) {
      console.error(`${SYNC_LOG} scan: failed error=${scan.error ?? 'unknown'}`)
      return { status: 'error', message: scan.error ?? 'Vault scan failed' }
    }
    console.error(
      `${SYNC_LOG} scan: ok fileCount=${scan.fileCount} truncated=${scan.truncated} vaultRoot=${scan.vaultRoot}`,
    )

    const updated = await updateVaultSyncStatus(vaultId, scan.fileCount, { status: 'connected' })
    if (!updated) {
      console.error(`${SYNC_LOG} supabase vault update: failed vaultId=${vaultId}`)
      return { status: 'error', message: 'Failed to update vault sync status' }
    }
    console.error(
      `${SYNC_LOG} supabase vault update: ok file_count=${updated.file_count} last_synced_at=${updated.last_synced_at}`,
    )

    console.error(`${SYNC_LOG} metadata: start rows=${scan.files.length}`)
    const meta = await replaceVaultFileMetadata(supabase, vaultId, userId, scan.files)
    if (meta.error) {
      console.error(`${SYNC_LOG} metadata: failed error=${meta.error}`)
      return {
        status: 'error',
        message: `Sync counted ${scan.fileCount} files but metadata storage failed: ${meta.error}`,
        file_count: scan.fileCount,
        last_synced_at: updated.last_synced_at ?? undefined,
        vault: updated,
      }
    }
    console.error(`${SYNC_LOG} metadata: ok stored=${meta.stored}`)

    const truncatedNote = scan.truncated ? ' (file list truncated at limit)' : ''
    const metaNote = meta.stored ? ' File metadata saved.' : ''
    const pathNote = migratedFrom
      ? ' Vault path updated to the in-repo JD Command Vault location.'
      : ''

    if (isJdCommandVaultRow(activeVault.local_path, activeVault.name)) {
      void import('@/lib/jyson/vault-context')
        .then(({ buildVaultContentIndex }) => buildVaultContentIndex(scanPath))
        .catch((err) => {
          console.error(
            `${SYNC_LOG} vault index: failed`,
            err instanceof Error ? err.message : err,
          )
        })
    }

    console.error(`${SYNC_LOG} complete: synced fileCount=${scan.fileCount}`)
    return {
      status: 'synced',
      message: `Synced ${scan.fileCount} files from your vault.${metaNote}${pathNote}${truncatedNote}`,
      file_count: scan.fileCount,
      last_synced_at: updated.last_synced_at ?? undefined,
      vault: migratedFrom ? { ...updated, local_path: activeVault.local_path } : updated,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error(`${SYNC_LOG} uncaught exception: ${message}`, stack)
    return { status: 'error', message: `Sync failed unexpectedly: ${message}` }
  }
}
