'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { JD_AI_SYSTEM_VAULT_KEY, VAULT_CONNECTION_ACTIVE_STATUSES } from '@/lib/vault/constants'
import {
  PRIMARY_VAULT_KEY,
  provisionVaultConnectionsForIdentity,
} from '@/lib/vault/provision'
import type { VaultConnectionSummary } from '@/types/db'

type IdentityRow = {
  id: string
  clerk_user_id: string
  handle: string
}

function isMissingVaultTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    (error.message?.includes('vault_connections') ?? false)
  )
}

export async function ensureVaultConnectionsForIdentity(
  supabase: SupabaseClient,
  identity: IdentityRow
): Promise<void> {
  await provisionVaultConnectionsForIdentity(supabase, identity)
}

type VaultRow = {
  vault_key: string
  display_name: string
  status: string
  connector_type: string
  last_seen_at: string | null
  last_sync_at: string | null
  last_sync_status: string | null
}

function pickDisplayVault(rows: VaultRow[]): VaultRow | null {
  if (!rows.length) return null
  const jd = rows.find((r) => r.vault_key === JD_AI_SYSTEM_VAULT_KEY)
  if (jd) return jd
  const primary = rows.find((r) => r.vault_key === PRIMARY_VAULT_KEY)
  return primary ?? rows[0]
}

function toSummary(row: VaultRow): VaultConnectionSummary {
  return {
    vaultKey: row.vault_key,
    displayName: row.display_name,
    status: row.status,
    connectorType: row.connector_type,
    lastSeenAt: row.last_seen_at ?? null,
    lastSyncAt: row.last_sync_at ?? null,
    lastSyncStatus: row.last_sync_status ?? null,
  }
}

export async function fetchVaultConnectionSummary(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<VaultConnectionSummary | null> {
  const { data, error } = await supabase
    .from('vault_connections')
    .select(
      'vault_key, display_name, status, connector_type, last_seen_at, last_sync_at, last_sync_status'
    )
    .eq('clerk_user_id', clerkUserId)

  if (isMissingVaultTable(error)) return null
  if (!data?.length) return null

  const row = pickDisplayVault(data as VaultRow[])
  return row ? toSummary(row) : null
}

export async function countVaultConnections(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('vault_connections')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', clerkUserId)
    .in('status', VAULT_CONNECTION_ACTIVE_STATUSES)

  if (isMissingVaultTable(error)) return 0
  return count ?? 0
}
