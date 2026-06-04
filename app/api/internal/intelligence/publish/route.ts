import { NextRequest, NextResponse } from 'next/server'
import { verifyCronOrInternalAuth } from '@/lib/email/agents/cron-auth'
import { mapDossierJsonToIntake } from '@/lib/intelligence/load-dossier'
import { publishIntakeSnapshot } from '@/lib/intelligence/publish-from-intake'
import type { EmailIntakePayload } from '@/lib/email/agents/types'

/**
 * Full-cloud / serverless publish boundary.
 *
 * Any producer that does NOT have the monorepo on disk (a Cursor cloud agent, a
 * future serverless research function, an external worker) can POST a passed
 * ACCESS Intelligence Dossier here. We map it to an intake and push it through the
 * SAME gated publish funnel as the local path — so the Quality Gate is enforced
 * identically no matter who produced the brief.
 *
 * POST body (either shape):
 *   { "dossier": { ...AccessIntelligenceDossier JSON (must include `quality`) } }
 *   { "intake":  { ...EmailIntakePayload } }
 *
 * Auth: Authorization: Bearer CRON_SECRET  OR  x-internal-email-secret.
 */
export async function POST(request: NextRequest) {
  const denied = verifyCronOrInternalAuth(request)
  if (denied) return denied

  let body: { dossier?: Record<string, unknown>; intake?: EmailIntakePayload; force?: boolean }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  let intake: EmailIntakePayload
  try {
    if (body.dossier) {
      intake = mapDossierJsonToIntake(body.dossier)
    } else if (body.intake?.source_type && body.intake.payload) {
      intake = body.intake
    } else {
      return NextResponse.json(
        { ok: false, error: 'Provide either `dossier` (ACCESS Intelligence Dossier JSON) or `intake`.' },
        { status: 400 }
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }

  // Single gated funnel — refuses to publish anything that didn't pass the gate.
  const result = await publishIntakeSnapshot(intake, { force: body.force === true })
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        held_by_quality_gate: true,
        error: result.error,
        quality_score: intake.payload?.quality_score,
        quality_grade: intake.payload?.quality_grade,
      },
      { status: 422 }
    )
  }

  return NextResponse.json({
    ok: true,
    published: true,
    source_id: intake.source_id,
    quality_score: intake.payload?.quality_score,
    quality_grade: intake.payload?.quality_grade,
  })
}
