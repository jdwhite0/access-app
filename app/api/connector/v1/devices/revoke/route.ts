import type { NextRequest } from 'next/server'
import { authenticateConnectorRequest } from '@/lib/connector-auth/middleware'
import { createSupabaseAdmin } from '@/lib/supabase'
import { revokeConnectorDevice } from '@/lib/connector/device-service'
import { jsonError, jsonOk } from '@/lib/api/connector-response'

export async function POST(req: NextRequest) {
  const auth = await authenticateConnectorRequest(req, 'heartbeat')
  if (!auth.ok) return jsonError(auth.error, auth.status)

  const supabase = createSupabaseAdmin()
  if (!supabase) return jsonError('Database not configured.', 503)

  const revoked = await revokeConnectorDevice({
    supabase,
    deviceId: auth.device.sub,
    identityId: auth.device.identity_id,
  })

  if (!revoked.ok) return jsonError(revoked.error, 500)

  return jsonOk({ ok: true, revoked: true })
}
