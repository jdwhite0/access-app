/**
 * DEV-ONLY vault seeds — isolated from platform provisioning.
 * Set ACCESS_DEV_VAULT_SEED_HANDLES=jerry.access,jdwhite0.access to enable JD_AI_System row.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  JD_AI_SYSTEM_VAULT_DISPLAY_NAME,
  JD_AI_SYSTEM_VAULT_KEY,
  VAULT_CONNECTOR_TYPE_LOCAL,
  VAULT_TYPE_LOCAL_INTELLIGENCE,
} from '@/lib/vault/constants'

type IdentityRow = {
  id: string
  clerk_user_id: string
  handle: string
}

export function getDevVaultSeedHandles(): string[] {
  const fromEnv = process.env.ACCESS_DEV_VAULT_SEED_HANDLES?.trim()
  if (!fromEnv) return []
  return fromEnv.split(',').map((h) => h.trim()).filter(Boolean)
}

function isMissingVaultTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    (error.message?.includes('vault_connections') ?? false)
  )
}

/** Optional dev seed: JD_AI_System intelligence vault for operator handles. */
export async function applyDevJdAiSystemVaultSeed(
  supabase: SupabaseClient,
  identity: IdentityRow
): Promise<void> {
  const handles = getDevVaultSeedHandles()
  if (!handles.includes(identity.handle)) return

  const { data: existing, error: existingError } = await supabase
    .from('vault_connections')
    .select('id, status')
    .eq('identity_id', identity.id)
    .eq('vault_key', JD_AI_SYSTEM_VAULT_KEY)
    .maybeSingle()

  if (isMissingVaultTable(existingError)) return

  if (existing) {
    if (['connected', 'syncing'].includes(existing.status)) return
    return
  }

  const { error: insertError } = await supabase.from('vault_connections').insert({
    identity_id: identity.id,
    clerk_user_id: identity.clerk_user_id,
    vault_key: JD_AI_SYSTEM_VAULT_KEY,
    display_name: JD_AI_SYSTEM_VAULT_DISPLAY_NAME,
    connector_type: VAULT_CONNECTOR_TYPE_LOCAL,
    status: 'pending_connector',
    root_label: 'Private intelligence vault',
    config: {
      vaultType: VAULT_TYPE_LOCAL_INTELLIGENCE,
      compileProfile: 'jd_operator_full',
      seed: 'dev_jd_ai_system',
    },
  })

  if (isMissingVaultTable(insertError)) return
}
