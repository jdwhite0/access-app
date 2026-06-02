import type { NextRequest } from 'next/server'
import { authenticateConnectorRequest } from '@/lib/connector-auth/middleware'
import { createSupabaseAdmin } from '@/lib/supabase'
import { revokeConnectorDevice } from '@/lib/connector/device-service'
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

  const revoked = await revokeConnectorDevice({
    supabase,
    deviceId: auth.device.sub,
    identityId: auth.device.identity_id,
  })

  if (!revoked.ok) {
    return classifiedErrorResponse({
      error: revoked.error,
      product: 'access_os',
      service: 'connector',
    })
  }

  return jsonOk({ ok: true, revoked: true })
}
