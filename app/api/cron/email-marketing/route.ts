import { NextRequest, NextResponse } from 'next/server'
import { verifyCronOrInternalAuth } from '@/lib/email/agents/cron-auth'
import { resolveDailyBriefIntake } from '@/lib/email/agents/dossier-intake'
import { runEmailIntakePipeline } from '@/lib/email/agents/pipeline'
import { toMarketingIntake, isSupportedMarketingType } from '@/lib/email/agents/marketing-intake'

/**
 * Layer 2 cron — marketing emails on their own cadences, from the SAME gated dossier.
 *
 * GET /api/cron/email-marketing?type=weekly_digest|product_update|educational_content
 *
 * Reuses the leading founder-brief framework end to end:
 *   resolve gated brief → reshape to type → re-check Quality Gate → queue → (email-dispatch sends)
 * Nothing weak ships: if the underlying dossier didn't pass, every derived type is held too.
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronOrInternalAuth(request)
  if (denied) return denied

  const type = request.nextUrl.searchParams.get('type') ?? ''
  if (!isSupportedMarketingType(type)) {
    return NextResponse.json(
      { ok: false, error: `Unsupported type "${type}". Use weekly_digest | product_update | educational_content.` },
      { status: 400 }
    )
  }

  try {
    const { intake: brief, dossierPath, source } = await resolveDailyBriefIntake({ publishSnapshot: false })

    const requirePass = process.env.EMAIL_REQUIRE_QUALITY_PASS !== 'false'
    if (requirePass && brief.payload?.quality_passed !== true) {
      return NextResponse.json(
        {
          ok: false,
          held_by_quality_gate: true,
          type,
          reason:
            brief.payload?.quality_passed === false
              ? `Source brief failed the quality gate (score ${brief.payload?.quality_score ?? '?'}). ${type} not sent.`
              : `No quality verdict on the source brief — refusing to send ${type}.`,
          dossierPath,
        },
        { status: 422 }
      )
    }

    const intake = toMarketingIntake(brief, type)
    const result = await runEmailIntakePipeline(intake, { sendImmediately: true })

    return NextResponse.json(
      {
        ok: result.ok,
        type,
        intakeSource: source,
        quality_score: brief.payload?.quality_score,
        queued: result.queued,
        skipped: result.skipped,
        errors: result.errors,
        queue_ids: result.queue_ids,
      },
      { status: result.ok ? 200 : 422 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
