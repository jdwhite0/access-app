import { createSupabaseAdmin } from '@/lib/supabase'
import { registerConnectorDevice } from '@/lib/connector/device-service'
import { jsonError, jsonOk } from '@/lib/api/connector-response'
import { isConnectorJwtConfigured } from '@/lib/connector-auth/jwt'

export async function POST(req: Request) {
  if (!isConnectorJwtConfigured()) {
    return jsonError('Connector JWT not configured on server.', 503)
  }

  const supabase = createSupabaseAdmin()
  if (!supabase) return jsonError('Database not configured.', 503)

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

  if (!result.ok) return jsonError(result.error, 400)

  return jsonOk({
    ok: true,
    deviceId: result.deviceId,
    token: result.token,
    expiresAt: result.expiresAt,
    permissions: result.permissions,
  })
}
