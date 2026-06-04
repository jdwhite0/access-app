import { NextRequest, NextResponse } from 'next/server'
import { verifyCronOrInternalAuth } from '@/lib/email/agents/cron-auth'
import { buildDailyBriefIntakeFromLatest } from '@/lib/email/agents/dossier-intake'
import { runEmailIntakePipeline } from '@/lib/email/agents/pipeline'

/**
 * Cron / operator: queue daily brief from latest approved JDAI dossier.
 * GET /api/cron/email-daily-brief
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronOrInternalAuth(request)
  if (denied) return denied

  try {
    const { intake, dossierPath } = buildDailyBriefIntakeFromLatest()
    const result = await runEmailIntakePipeline(intake, { sendImmediately: true })

    return NextResponse.json({
      ok: result.ok,
      dossierPath,
      queued: result.queued,
      skipped: result.skipped,
      errors: result.errors,
      queue_ids: result.queue_ids,
    }, { status: result.ok ? 200 : 422 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
