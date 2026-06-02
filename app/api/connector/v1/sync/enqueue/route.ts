import type { NextRequest } from 'next/server'
import { authenticateConnectorRequest } from '@/lib/connector-auth/middleware'
import { createSupabaseAdmin } from '@/lib/supabase'
import { enqueueSyncJob } from '@/lib/sync/queue'
import { jsonError, jsonOk } from '@/lib/api/connector-response'

export async function POST(req: NextRequest) {
  const auth = await authenticateConnectorRequest(req, 'sync:enqueue')
  if (!auth.ok) return jsonError(auth.error, auth.status)

  const supabase = createSupabaseAdmin()
  if (!supabase) return jsonError('Database not configured.', 503)

  let plan: unknown
  try {
    plan = await req.json()
  } catch {
    return jsonError('Invalid JSON body.', 400)
  }

  const result = await enqueueSyncJob({
    supabase,
    device: auth.device,
    planPayload: plan,
  })

  if (!result.ok) return jsonError(result.error, 422)

  return jsonOk({ ok: true, jobId: result.jobId })
}
