import type { SupabaseClient } from '@supabase/supabase-js'
import { VAULT_CONNECTOR_TYPE_LOCAL, VAULT_TYPE_LOCAL_INTELLIGENCE } from '@/lib/vault/constants'
import { applyDevJdAiSystemVaultSeed } from '@/lib/vault/dev-seed'

export const PRIMARY_VAULT_KEY = 'primary_vault'
export const PRIMARY_VAULT_DISPLAY_NAME = 'Primary Intelligence Vault'

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

/** Platform default: every identity gets a primary_vault connection row. */
export async function ensurePrimaryVaultConnection(
  supabase: SupabaseClient,
  identity: IdentityRow
): Promise<void> {
  const { data: existing, error: existingError } = await supabase
    .from('vault_connections')
    .select('id')
    .eq('identity_id', identity.id)
    .eq('vault_key', PRIMARY_VAULT_KEY)
    .maybeSingle()

  if (isMissingVaultTable(existingError)) return
  if (existing) return

  const { error: insertError } = await supabase.from('vault_connections').insert({
    identity_id: identity.id,
    clerk_user_id: identity.clerk_user_id,
    vault_key: PRIMARY_VAULT_KEY,
    display_name: PRIMARY_VAULT_DISPLAY_NAME,
    connector_type: VAULT_CONNECTOR_TYPE_LOCAL,
    status: 'pending_connector',
    root_label: 'Intelligence vault',
    config: { vaultType: VAULT_TYPE_LOCAL_INTELLIGENCE },
  })

  if (isMissingVaultTable(insertError)) return
}

/** Provision vault rows for a new or existing identity (multi-user safe). */
export async function provisionVaultConnectionsForIdentity(
  supabase: SupabaseClient,
  identity: IdentityRow
): Promise<void> {
  await ensurePrimaryVaultConnection(supabase, identity)
  await applyDevJdAiSystemVaultSeed(supabase, identity)
}
