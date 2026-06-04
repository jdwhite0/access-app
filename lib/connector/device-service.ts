import type { SupabaseClient } from '@supabase/supabase-js'
import { hashConnectorToken } from '@/lib/connector-auth/token-hash'
import { signConnectorDeviceToken } from '@/lib/connector-auth/jwt'
import { DEFAULT_CONNECTOR_PERMISSIONS, parsePermissions } from '@/lib/connector/permissions'
import type { ConnectorPermission } from '@/lib/connector-auth/types'

export async function registerConnectorDevice(input: {
  supabase: SupabaseClient
  pairingCode: string
  deviceName: string
  machineId?: string
  publicKey?: string
}): Promise<
  | {
      ok: true
      deviceId: string
      token: string
      expiresAt: string
      permissions: ConnectorPermission[]
    }
  | { ok: false; error: string }
> {
  const code = input.pairingCode.trim().toUpperCase()
  const { data: pairing, error: pairError } = await input.supabase
    .from('connector_pairing_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle()

  if (pairError || !pairing) {
    return { ok: false, error: 'Invalid or expired pairing code.' }
  }

  if (pairing.consumed_at) {
    return { ok: false, error: 'Pairing code already used.' }
  }

  if (new Date(pairing.expires_at).getTime() < Date.now()) {
    return { ok: false, error: 'Pairing code expired.' }
  }

  let vaultConnectionId = pairing.vault_connection_id as string | null
  let vaultKey = 'primary_vault'

  if (vaultConnectionId) {
    const { data: vc } = await input.supabase
      .from('vault_connections')
      .select('id, vault_key, identity_id')
      .eq('id', vaultConnectionId)
      .maybeSingle()
    if (!vc || vc.identity_id !== pairing.identity_id) {
      return { ok: false, error: 'Vault connection invalid.' }
    }
    vaultKey = vc.vault_key
  } else {
    const { data: vc } = await input.supabase
      .from('vault_connections')
      .select('id, vault_key')
      .eq('identity_id', pairing.identity_id)
      .limit(1)
      .maybeSingle()
    if (vc) {
      vaultConnectionId = vc.id
      vaultKey = vc.vault_key
    }
  }

  if (!vaultConnectionId) {
    return { ok: false, error: 'No vault connection for identity.' }
  }

  const permissions = DEFAULT_CONNECTOR_PERMISSIONS

  const { data: device, error: deviceError } = await input.supabase
    .from('connector_devices')
    .insert({
      identity_id: pairing.identity_id,
      clerk_user_id: pairing.clerk_user_id,
      vault_connection_id: vaultConnectionId,
      device_name: input.deviceName,
      machine_id: input.machineId ?? null,
      public_key: input.publicKey ?? null,
      status: 'pending',
      permissions,
    })
    .select('id')
    .single()

  if (deviceError || !device) {
    return { ok: false, error: deviceError?.message ?? 'Device create failed.' }
  }

  const signed = await signConnectorDeviceToken({
    deviceId: device.id,
    identityId: pairing.identity_id,
    clerkUserId: pairing.clerk_user_id,
    vaultConnectionId,
    vaultKey,
    permissions,
  })

  if (!signed) {
    await input.supabase.from('connector_devices').delete().eq('id', device.id)
    return { ok: false, error: 'JWT signing not configured (ACCESS_CONNECTOR_JWT_SECRET).' }
  }

  const tokenHash = hashConnectorToken(signed.token)

  const { error: activateError } = await input.supabase
    .from('connector_devices')
    .update({
      status: 'active',
      token_hash: tokenHash,
      token_jti: signed.jti,
      token_expires_at: signed.expiresAt.toISOString(),
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', device.id)

  if (activateError) {
    return { ok: false, error: activateError.message }
  }

  await input.supabase
    .from('connector_pairing_codes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('code', code)

  await input.supabase
    .from('vault_connections')
    .update({ status: 'connected', last_seen_at: new Date().toISOString() })
    .eq('id', vaultConnectionId)

  return {
    ok: true,
    deviceId: device.id,
    token: signed.token,
    expiresAt: signed.expiresAt.toISOString(),
    permissions,
  }
}

export async function rotateConnectorDeviceToken(input: {
  supabase: SupabaseClient
  deviceId: string
  identityId: string
  clerkUserId: string
  vaultConnectionId: string
  vaultKey: string
  permissions: ConnectorPermission[]
}): Promise<
  | { ok: true; token: string; expiresAt: string }
  | { ok: false; error: string }
> {
  const signed = await signConnectorDeviceToken({
    deviceId: input.deviceId,
    identityId: input.identityId,
    clerkUserId: input.clerkUserId,
    vaultConnectionId: input.vaultConnectionId,
    vaultKey: input.vaultKey,
    permissions: input.permissions,
  })

  if (!signed) return { ok: false, error: 'JWT signing not configured.' }

  const tokenHash = hashConnectorToken(signed.token)

  const { error } = await input.supabase
    .from('connector_devices')
    .update({
      token_hash: tokenHash,
      token_jti: signed.jti,
      token_expires_at: signed.expiresAt.toISOString(),
      last_token_rotated_at: new Date().toISOString(),
    })
    .eq('id', input.deviceId)
    .eq('identity_id', input.identityId)

  if (error) return { ok: false, error: error.message }

  return { ok: true, token: signed.token, expiresAt: signed.expiresAt.toISOString() }
}

export async function revokeConnectorDevice(input: {
  supabase: SupabaseClient
  deviceId: string
  identityId: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await input.supabase
    .from('connector_devices')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      token_hash: null,
      token_jti: null,
    })
    .eq('id', input.deviceId)
    .eq('identity_id', input.identityId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function recordConnectorHeartbeat(input: {
  supabase: SupabaseClient
  deviceId: string
  identityId: string
  vaultConnectionId: string
}): Promise<{ ok: true; lastSeenAt: string } | { ok: false; error: string }> {
  const now = new Date().toISOString()

  const { data: device, error: deviceError } = await input.supabase
    .from('connector_devices')
    .update({ last_seen_at: now })
    .eq('id', input.deviceId)
    .select('id, last_seen_at')
    .maybeSingle()

  if (deviceError) {
    return { ok: false, error: deviceError.message }
  }
  if (!device?.id) {
    return { ok: false, error: 'Device heartbeat not persisted (device row not found).' }
  }

  await input.supabase
    .from('vault_connections')
    .update({ last_seen_at: now })
    .eq('id', input.vaultConnectionId)
    .eq('identity_id', input.identityId)

  return { ok: true, lastSeenAt: (device.last_seen_at as string) ?? now }
}
