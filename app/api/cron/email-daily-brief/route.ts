import { NextRequest, NextResponse } from 'next/server'
import { verifyCronOrInternalAuth } from '@/lib/email/agents/cron-auth'
import { resolveDailyBriefIntake } from '@/lib/email/agents/dossier-intake'
import { runEmailIntakePipeline } from '@/lib/email/agents/pipeline'

/**
 * Cron / operator: queue daily brief from latest approved JDAI dossier.
 * Vercel: reads Supabase snapshot when jdai-content-engine is not on disk.
 * GET /api/cron/email-daily-brief
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronOrInternalAuth(request)
  if (denied) return denied

  try {
    const { intake, dossierPath, source } = await resolveDailyBriefIntake({
      publishSnapshot: false,
    })

    // Quality Gate enforcement — nothing weak ships autonomously.
    // Default strict: require an explicit pass. Set EMAIL_REQUIRE_QUALITY_PASS=false to relax.
    const requirePass = process.env.EMAIL_REQUIRE_QUALITY_PASS !== 'false'
    const qualityPassed = intake.payload?.quality_passed
    if (requirePass && qualityPassed !== true) {
      return NextResponse.json(
        {
          ok: false,
          held_by_quality_gate: true,
          reason:
            qualityPassed === false
              ? `Brief failed the quality gate (score ${intake.payload?.quality_score ?? '?'}, ${intake.payload?.quality_blocking ?? '?'} blocking). Not sent.`
              : 'No quality verdict on this brief — refusing to send unverified content. Re-run the orchestrator to stamp a verdict.',
          dossierPath,
          intakeSource: source,
          quality_score: intake.payload?.quality_score,
          quality_grade: intake.payload?.quality_grade,
        },
        { status: 422 }
      )
    }

    const result = await runEmailIntakePipeline(intake, { sendImmediately: true })

    return NextResponse.json({
      ok: result.ok,
      dossierPath,
      intakeSource: source,
      quality_score: intake.payload?.quality_score,
      quality_grade: intake.payload?.quality_grade,
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
