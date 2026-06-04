import { NextRequest, NextResponse } from 'next/server'
import { verifyCronOrInternalAuth } from '@/lib/email/agents/cron-auth'
import { buildWeeklyDigestIntakeFromManifest } from '@/lib/email/agents/weekly-digest-intake'
import { runEmailIntakePipeline } from '@/lib/email/agents/pipeline'

/**
 * Cron: queue weekly digest from recent JDAI dossiers (filesystem on build host;
 * falls back to manifest scan when jdai-content-engine is bundled).
 * GET /api/cron/email-weekly-digest
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronOrInternalAuth(request)
  if (denied) return denied

  try {
    const intake = buildWeeklyDigestIntakeFromManifest()
    const result = await runEmailIntakePipeline(intake, { sendImmediately: true })

    return NextResponse.json({
      ok: result.ok,
      source_id: intake.source_id,
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
