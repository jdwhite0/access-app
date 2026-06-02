import type { NextRequest } from 'next/server'
import { authenticateConnectorRequest } from '@/lib/connector-auth/middleware'
import { createSupabaseAdmin } from '@/lib/supabase'
import { recordConnectorHeartbeat } from '@/lib/connector/device-service'
import { jsonError, jsonOk } from '@/lib/api/connector-response'

export async function POST(req: NextRequest) {
  const auth = await authenticateConnectorRequest(req, 'heartbeat')
  if (!auth.ok) return jsonError(auth.error, auth.status)

  const supabase = createSupabaseAdmin()
  if (!supabase) return jsonError('Database not configured.', 503)

  await recordConnectorHeartbeat({
    supabase,
    deviceId: auth.device.sub,
    identityId: auth.device.identity_id,
    vaultConnectionId: auth.device.vault_connection_id,
  })

  return jsonOk({ ok: true, at: new Date().toISOString() })
}
