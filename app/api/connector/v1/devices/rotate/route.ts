import type { NextRequest } from 'next/server'
import { authenticateConnectorRequest } from '@/lib/connector-auth/middleware'
import { createSupabaseAdmin } from '@/lib/supabase'
import { rotateConnectorDeviceToken } from '@/lib/connector/device-service'
import { parsePermissions } from '@/lib/connector/permissions'
import { classifiedErrorResponse, jsonOk } from '@/lib/api/connector-response'

export async function POST(req: NextRequest) {
  const auth = await authenticateConnectorRequest(req, 'heartbeat')
  if (!auth.ok) {
    return classifiedErrorResponse(
      { error: new Error(`Unauthorized: ${auth.error}`), httpStatus: auth.status, product: 'access_os', service: 'auth' },
      { httpStatus: auth.status }
    )
  }

  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return classifiedErrorResponse({
      message: 'Database not configured.',
      product: 'access_os',
      service: 'database',
    })
  }

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

  if (!rotated.ok) {
    return classifiedErrorResponse({
      error: rotated.error,
      product: 'access_os',
      service: 'connector',
    })
  }

  return jsonOk({
    ok: true,
    token: rotated.token,
    expiresAt: rotated.expiresAt,
  })
}
