/**
 * Final founder-only production test — run locally against production Supabase + Resend.
 * npm run email:founder-prod-test
 */
import { loadAccessEnv } from '../lib/email/agents/load-env'
import { resolveDailyBriefIntake } from '../lib/email/agents/dossier-intake'
import { runEmailIntakePipeline, dispatchDueQueuedEmails } from '../lib/email/agents/pipeline'
import { createUnsubscribeToken } from '../lib/email/tokens'
import {
  getFounderTestEmail,
  getFounderTestUserId,
  isEmailTestMode,
  isFounderTestRecipient,
} from '../lib/email/agents/config'
import { getAppBaseUrl } from '../lib/email/constants'
import { updateEmailPreferences } from '../lib/email/preferences-db'
import { logEmailConsent } from '../lib/email/consent'
import { createSupabaseAdmin } from '../lib/supabase'

const BASE = () => getAppBaseUrl().replace(/\/$/, '')

type Result = { name: string; ok: boolean; detail?: string }

function result(name: string, ok: boolean, detail?: string): Result {
  return { name, ok, detail }
}

async function resetFounderForTestSend(userId: string, email: string): Promise<void> {
  const supabase = createSupabaseAdmin()
  if (supabase) {
    await supabase.from('email_unsubscribe_events').delete().eq('email', email.toLowerCase().trim())
  }
  await updateEmailPreferences(userId, {
    marketing_paused: false,
    frequency: 'daily',
    daily_brief_enabled: true,
    weekly_digest_enabled: true,
    product_updates_enabled: true,
    founder_notes_enabled: true,
    educational_content_enabled: true,
  })
  await logEmailConsent({
    userId,
    email,
    consentType: 'daily_brief',
    consentStatus: 'granted',
    source: 'founder_prod_test_reset',
  })
}

async function checkUrl(path: string, acceptAuth = false): Promise<Result> {
  const url = `${BASE()}${path.startsWith('/') ? path : `/${path}`}`
  try {
    const res = await fetch(url, { redirect: 'manual' })
    const ok =
      res.status === 200 ||
      (acceptAuth &&
        (res.status === 307 ||
          res.status === 308 ||
          res.status === 302 ||
          res.status === 303 ||
          res.status === 401))
    const location = res.headers.get('location')
    const detail =
      acceptAuth && location
        ? `HTTP ${res.status} → ${location}`
        : `HTTP ${res.status} — ${url}`
    return result(`${path} reachable`, ok, detail)
  } catch (e) {
    return result(`${path}`, false, e instanceof Error ? e.message : String(e))
  }
}

async function main() {
  loadAccessEnv()
  const results: Result[] = []
  const founderEmail = getFounderTestEmail()
  const founderId = getFounderTestUserId()
  const sourceId = `founder-prod-final-${Date.now()}`

  results.push(result('EMAIL_TEST_MODE=true locally', isEmailTestMode()))
  results.push(result('Founder email configured', !!founderEmail, founderEmail ?? undefined))
  results.push(result('Founder user id configured', !!founderId))

  // 5. Non-founder must not be eligible
  results.push(
    result(
      'Non-founder blocked by test mode',
      !isFounderTestRecipient('00000000-0000-0000-0000-000000000099', 'notfounder@example.com'),
    )
  )
  results.push(
    result(
      'Founder is eligible',
      !!founderEmail && !!founderId && isFounderTestRecipient(founderId, founderEmail),
    )
  )

  const nonFounderPipeline = await runEmailIntakePipeline(
    {
      source_type: 'jdai_dossier',
      source_id: `${sourceId}-nonfounder-gate`,
      payload: {
        handle: 'other.user',
        system_status: 'test',
        intelligence_summary: 'Non-founder gate test',
        recommended_action: 'Should skip',
        product_tip: 'Skip',
      },
    },
    {
      explicitRecipients: [
        {
          user_id: '00000000-0000-0000-0000-000000000099',
          email: 'notfounder@example.com',
          segment: 'explicit_non_founder',
        },
      ],
    }
  )
  results.push(
    result(
      'Non-founder explicit recipient skipped (not queued)',
      nonFounderPipeline.queued === 0 && nonFounderPipeline.skipped >= 1,
      `queued=${nonFounderPipeline.queued} skipped=${nonFounderPipeline.skipped}`
    )
  )

  // 1. Send founder daily brief (reset prior unsubscribe from validation test)
  if (founderId && founderEmail) {
    await resetFounderForTestSend(founderId, founderEmail)
    results.push(result('Founder preferences restored for test send', true))
  }

  const { intake, dossierPath } = await resolveDailyBriefIntake({ publishSnapshot: true })
  intake.source_id = sourceId

  const pipeline = await runEmailIntakePipeline(intake, { sendImmediately: true })
  results.push(
    result(
      'Founder daily brief pipeline',
      pipeline.ok && pipeline.queued === 1,
      `queued=${pipeline.queued} errors=${pipeline.errors.join(';')}`
    )
  )

  const dispatch = await dispatchDueQueuedEmails(25)
  results.push(
    result(
      'Founder daily brief dispatched',
      dispatch.sent === 1 && dispatch.failed === 0,
      JSON.stringify({ sent: dispatch.sent, failed: dispatch.failed, processed: dispatch.processed })
    )
  )

  console.log('[founder-prod-test] dossier:', dossierPath)
  console.log('[founder-prod-test] source_id:', sourceId)
  console.log('[founder-prod-test] queue_ids:', pipeline.queue_ids)

  // 2. Unsubscribe link (API + page)
  if (founderEmail) {
    const token = createUnsubscribeToken({ email: founderEmail, category: 'daily_brief' })
    if (token) {
      const apiRes = await fetch(`${BASE()}/api/email/unsubscribe?token=${encodeURIComponent(token)}`)
      const apiJson = (await apiRes.json()) as { preview?: { email: string }; error?: string }
      results.push(
        result(
          'Unsubscribe API validates token',
          apiRes.ok && apiJson.preview?.email === founderEmail.toLowerCase(),
          apiRes.ok ? apiJson.preview?.email : apiJson.error
        )
      )
      results.push(await checkUrl(`/unsubscribe?token=${encodeURIComponent(token)}`))
    } else {
      results.push(result('Unsubscribe token generation', false))
    }
  }

  // 3–4. Public / auth-protected routes
  results.push(await checkUrl('/settings/notifications-email', true))
  results.push(await checkUrl('/dashboard', true))
  results.push(await checkUrl('/email-preferences'))
  results.push(await checkUrl('/privacy'))
  results.push(await checkUrl('/terms'))

  const failed = results.filter((r) => !r.ok)
  console.log(JSON.stringify({ ok: failed.length === 0, results, founderEmail, sourceId }, null, 2))

  if (failed.length) {
    console.error(`\n[founder-prod-test] ${failed.length} check(s) failed.`)
    process.exit(1)
  }

  console.log('\n[founder-prod-test] All checks passed. Check inbox for the daily brief email.')
}

main().catch((err) => {
  console.error('[founder-prod-test]', err instanceof Error ? err.message : err)
  process.exit(1)
})
