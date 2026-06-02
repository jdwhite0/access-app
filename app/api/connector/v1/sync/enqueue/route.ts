import type { NextRequest } from 'next/server'
import { authenticateConnectorRequest } from '@/lib/connector-auth/middleware'
import { createSupabaseAdmin } from '@/lib/supabase'
import { enqueueSyncJob } from '@/lib/sync/queue'
import { classifiedErrorResponse, jsonError, jsonOk } from '@/lib/api/connector-response'

export async function POST(req: NextRequest) {
  const auth = await authenticateConnectorRequest(req, 'sync:enqueue')
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

  if (!result.ok) {
    return classifiedErrorResponse({
      error: result.error,
      product: 'access_os',
      service: 'sync_engine',
    })
  }

  return jsonOk({ ok: true, jobId: result.jobId })
}
