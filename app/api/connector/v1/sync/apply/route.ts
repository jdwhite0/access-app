import type { NextRequest } from 'next/server'
import { authenticateConnectorRequest } from '@/lib/connector-auth/middleware'
import { createSupabaseAdmin } from '@/lib/supabase'
import { executeSyncApply } from '@/lib/sync/apply-engine'
import { jsonError, jsonOk } from '@/lib/api/connector-response'

export async function POST(req: NextRequest) {
  const auth = await authenticateConnectorRequest(req, 'sync:apply')
  if (!auth.ok) return jsonError(auth.error, auth.status)

  const supabase = createSupabaseAdmin()
  if (!supabase) return jsonError('Database not configured.', 503)

  let plan: unknown
  try {
    plan = await req.json()
  } catch {
    return jsonError('Invalid JSON body.', 400)
  }

  const report = await executeSyncApply({
    supabase,
    device: auth.device,
    planPayload: plan,
    runType: 'connector_apply',
  })

  if (!report.ok) {
    return jsonOk({ ...report, ok: false }, 422)
  }

  return jsonOk({ ...report, ok: true })
}
