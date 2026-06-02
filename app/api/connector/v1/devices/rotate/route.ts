import type { NextRequest } from 'next/server'
import { authenticateConnectorRequest } from '@/lib/connector-auth/middleware'
import { createSupabaseAdmin } from '@/lib/supabase'
import { rotateConnectorDeviceToken } from '@/lib/connector/device-service'
import { parsePermissions } from '@/lib/connector/permissions'
import { jsonError, jsonOk } from '@/lib/api/connector-response'

export async function POST(req: NextRequest) {
  const auth = await authenticateConnectorRequest(req, 'heartbeat')
  if (!auth.ok) return jsonError(auth.error, auth.status)

  const supabase = createSupabaseAdmin()
  if (!supabase) return jsonError('Database not configured.', 503)

  const { data: device } = await supabase
    .from('connector_devices')
    .select('permissions')
    .eq('id', auth.device.sub)
    .single()

  const permissions = parsePermissions(device?.permissions)

  const rotated = await rotateConnectorDeviceToken({
    supabase,
    deviceId: auth.device.sub,
    identityId: auth.device.identity_id,
    clerkUserId: auth.device.clerk_user_id,
    vaultConnectionId: auth.device.vault_connection_id,
    vaultKey: auth.device.vault_key,
    permissions,
  })

  if (!rotated.ok) return jsonError(rotated.error, 500)

  return jsonOk({
    ok: true,
    token: rotated.token,
    expiresAt: rotated.expiresAt,
  })
}
