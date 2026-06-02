import { createSupabaseAdmin } from '@/lib/supabase'
import { registerConnectorDevice } from '@/lib/connector/device-service'
import { classifiedErrorResponse, jsonError, jsonOk } from '@/lib/api/connector-response'
import { isConnectorJwtConfigured } from '@/lib/connector-auth/jwt'

export async function POST(req: Request) {
  if (!isConnectorJwtConfigured()) {
    return classifiedErrorResponse({
      message: 'Connector JWT not configured on server.',
      product: 'access_os',
      service: 'configuration',
    })
  }

  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return classifiedErrorResponse({
      message: 'Database not configured.',
      product: 'access_os',
      service: 'database',
    })
  }

  let body: {
    pairingCode?: string
    deviceName?: string
    machineId?: string
    publicKey?: string
  }

  try {
    body = await req.json()
  } catch {
    return jsonError('Invalid JSON body.', 400)
  }

  if (!body.pairingCode?.trim() || !body.deviceName?.trim()) {
    return jsonError('pairingCode and deviceName are required.', 400)
  }

  const result = await registerConnectorDevice({
    supabase,
    pairingCode: body.pairingCode,
    deviceName: body.deviceName,
    machineId: body.machineId,
    publicKey: body.publicKey,
  })

  if (!result.ok) {
    return classifiedErrorResponse({
      error: result.error,
      product: 'access_os',
      service: 'connector',
    })
  }

  return jsonOk({
    ok: true,
    deviceId: result.deviceId,
    token: result.token,
    expiresAt: result.expiresAt,
    permissions: result.permissions,
  })
}
