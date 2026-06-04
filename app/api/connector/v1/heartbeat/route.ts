import type { NextRequest } from 'next/server'
import { authenticateConnectorRequest } from '@/lib/connector-auth/middleware'
import { createSupabaseAdmin } from '@/lib/supabase'
import { recordConnectorHeartbeat } from '@/lib/connector/device-service'
import { classifiedErrorResponse, jsonOk } from '@/lib/api/connector-response'

export async function POST(req: NextRequest) {
  try {
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

    const heartbeat = await recordConnectorHeartbeat({
      supabase,
      deviceId: auth.device.sub,
      identityId: auth.device.identity_id,
      vaultConnectionId: auth.device.vault_connection_id,
    })

    if (!heartbeat.ok) {
      console.error('[connector/heartbeat]', heartbeat.error, {
        deviceId: auth.device.sub,
        identityId: auth.device.identity_id,
      })
      return classifiedErrorResponse({
        message: heartbeat.error,
        product: 'access_os',
        service: 'connector',
      })
    }

    return jsonOk({ ok: true, at: heartbeat.lastSeenAt })
  } catch (err) {
    console.error('[connector/heartbeat] unhandled:', err)
    return classifiedErrorResponse({
      error: err,
      product: 'access_os',
      service: 'connector',
    })
  }
}
