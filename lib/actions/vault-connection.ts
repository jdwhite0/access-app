'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getVaultSeedHandles,
  JD_AI_SYSTEM_VAULT_DISPLAY_NAME,
  JD_AI_SYSTEM_VAULT_KEY,
  VAULT_CONNECTOR_TYPE_LOCAL,
} from '@/lib/vault/constants'
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

export async function ensureJdAiSystemVaultConnection(
  supabase: SupabaseClient,
  identity: IdentityRow
): Promise<void> {
  const seedHandles = getVaultSeedHandles()
  if (!seedHandles.includes(identity.handle)) return

  const { data: existing, error: existingError } = await supabase
    .from('vault_connections')
    .select('id')
    .eq('identity_id', identity.id)
    .eq('vault_key', JD_AI_SYSTEM_VAULT_KEY)
    .maybeSingle()

  if (isMissingVaultTable(existingError)) return
  if (existing) return

  const { error: insertError } = await supabase.from('vault_connections').insert({
    identity_id: identity.id,
    clerk_user_id: identity.clerk_user_id,
    vault_key: JD_AI_SYSTEM_VAULT_KEY,
    display_name: JD_AI_SYSTEM_VAULT_DISPLAY_NAME,
    connector_type: VAULT_CONNECTOR_TYPE_LOCAL,
    status: 'pending_connector',
    root_label: 'Private intelligence vault (local Mac)',
    config: { compileProfile: 'jd_operator_full' },
  })

  if (isMissingVaultTable(insertError)) return
}

export async function fetchVaultConnectionSummary(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<VaultConnectionSummary | null> {
  const { data, error } = await supabase
    .from('vault_connections')
    .select('vault_key, display_name, status, last_sync_at')
    .eq('clerk_user_id', clerkUserId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (isMissingVaultTable(error)) return null
  if (!data) return null

  return {
    vaultKey: data.vault_key,
    displayName: data.display_name,
    status: data.status,
    lastSyncAt: data.last_sync_at ?? null,
  }
}

export async function countVaultConnections(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('vault_connections')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', clerkUserId)
    .in('status', ['connected', 'pending_connector', 'syncing'])

  if (isMissingVaultTable(error)) return 0
  return count ?? 0
}
