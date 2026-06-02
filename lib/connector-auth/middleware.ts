import type { NextRequest } from 'next/server'
import { verifyConnectorDeviceToken } from './jwt'
import type { ConnectorPermission, VerifiedConnectorDevice } from './types'
import { createSupabaseAdmin } from '@/lib/supabase'
import { hashConnectorToken } from './token-hash'

export type ConnectorAuthResult =
  | { ok: true; device: VerifiedConnectorDevice; tokenHash: string }
  | { ok: false; status: number; error: string }

export function bearerTokenFromRequest(req: NextRequest): string | null {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7).trim() || null
}

export async function authenticateConnectorRequest(
  req: NextRequest,
  requiredPermission?: ConnectorPermission
): Promise<ConnectorAuthResult> {
  const token = bearerTokenFromRequest(req)
  if (!token) {
    return { ok: false, status: 401, error: 'Missing Bearer token.' }
  }

  const verified = await verifyConnectorDeviceToken(token)
  if (!verified.ok) {
    return { ok: false, status: 401, error: verified.error }
  }

  if (
    requiredPermission &&
    !verified.claims.permissions.includes(requiredPermission)
  ) {
    return { ok: false, status: 403, error: `Missing permission: ${requiredPermission}` }
  }

  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return { ok: false, status: 503, error: 'Database not configured.' }
  }

  const tokenHash = hashConnectorToken(token)
  const { data: device, error } = await supabase
    .from('connector_devices')
    .select('id, status, token_hash, token_jti, token_expires_at')
    .eq('id', verified.claims.sub)
    .maybeSingle()

  if (error || !device) {
    return { ok: false, status: 401, error: 'Device not found.' }
  }

  if (device.status === 'revoked') {
    return { ok: false, status: 401, error: 'Device revoked.' }
  }

  if (device.status !== 'active') {
    return { ok: false, status: 401, error: 'Device not active.' }
  }

  if (device.token_jti && device.token_jti !== verified.claims.jti) {
    return { ok: false, status: 401, error: 'Token superseded. Rotate or re-register.' }
  }

  if (device.token_hash && device.token_hash !== tokenHash) {
    return { ok: false, status: 401, error: 'Token hash mismatch.' }
  }

  if (
    device.token_expires_at &&
    new Date(device.token_expires_at).getTime() < Date.now()
  ) {
    return { ok: false, status: 401, error: 'Token expired.' }
  }

  return { ok: true, device: verified.claims, tokenHash }
}
