import { NextRequest, NextResponse } from 'next/server'
import { verifyCronOrInternalAuth } from '@/lib/email/agents/cron-auth'
import { dispatchDueQueuedEmails } from '@/lib/email/agents/pipeline'

/**
 * Cron / operator: send due queued emails.
 * GET /api/cron/email-dispatch
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronOrInternalAuth(request)
  if (denied) return denied

  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '50')
  const result = await dispatchDueQueuedEmails(Number.isFinite(limit) ? limit : 50)

  return NextResponse.json({ ok: result.failed === 0, ...result })
}
