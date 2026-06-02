import type { SupabaseClient } from '@supabase/supabase-js'
import type { VerifiedConnectorDevice } from '@/lib/connector-auth/types'

export type OwnershipContext = {
  identityId: string
  clerkUserId: string
  vaultConnectionId: string
  vaultKey: string
  deviceId: string
  ownerHandle: string
}

export async function resolveOwnershipContext(
  supabase: SupabaseClient,
  device: VerifiedConnectorDevice
): Promise<{ ok: true; ctx: OwnershipContext } | { ok: false; error: string }> {
  const { data: identity, error: idError } = await supabase
    .from('access_identities')
    .select('id, clerk_user_id, handle, status')
    .eq('id', device.identity_id)
    .maybeSingle()

  if (idError || !identity) {
    return { ok: false, error: 'Identity not found.' }
  }

  if (identity.clerk_user_id !== device.clerk_user_id) {
    return { ok: false, error: 'Identity clerk mismatch.' }
  }

  if (identity.status !== 'active') {
    return { ok: false, error: 'Identity not active.' }
  }

  const { data: vault, error: vaultError } = await supabase
    .from('vault_connections')
    .select('id, identity_id, clerk_user_id, vault_key, status')
    .eq('id', device.vault_connection_id)
    .maybeSingle()

  if (vaultError || !vault) {
    return { ok: false, error: 'Vault connection not found.' }
  }

  if (vault.identity_id !== device.identity_id) {
    return { ok: false, error: 'Vault identity mismatch.' }
  }

  if (vault.clerk_user_id !== device.clerk_user_id) {
    return { ok: false, error: 'Vault clerk mismatch.' }
  }

  if (vault.status === 'revoked') {
    return { ok: false, error: 'Vault connection revoked.' }
  }

  if (device.vault_key && vault.vault_key !== device.vault_key) {
    return { ok: false, error: 'Vault key mismatch.' }
  }

  return {
    ok: true,
    ctx: {
      identityId: identity.id,
      clerkUserId: identity.clerk_user_id,
      vaultConnectionId: vault.id,
      vaultKey: vault.vault_key,
      deviceId: device.sub,
      ownerHandle: identity.handle,
    },
  }
}
