import type { NextRequest } from 'next/server'
import { authenticateConnectorRequest } from '@/lib/connector-auth/middleware'
import { createSupabaseAdmin } from '@/lib/supabase'
import { executeSyncApply } from '@/lib/sync/apply-engine'
import { classifiedErrorResponse, jsonError, jsonOk } from '@/lib/api/connector-response'

export async function POST(req: NextRequest) {
  const auth = await authenticateConnectorRequest(req, 'sync:apply')
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
