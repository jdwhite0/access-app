/**
 * ACCESS Email Agents — automated verification (MANUAL_TEST_PLAN coverage).
 * Run: npm run email:verify
 */
import { loadAccessEnv } from '../lib/email/agents/load-env'
import { createSupabaseAdmin } from '../lib/supabase'
import { routeEmailIntake } from '../lib/email/agents/intake-router'
import { generateEmailDraft } from '../lib/email/agents/generate-draft'
import { validateEmailCompliance } from '../lib/email/agents/compliance'
import { checkPreferenceGate } from '../lib/email/agents/preference-gate'
import { runEmailIntakePipeline } from '../lib/email/agents/pipeline'
import { resolveDailyBriefIntake } from '../lib/email/agents/dossier-intake'
import { fetchDailyBriefSnapshot } from '../lib/email/agents/intake-snapshot'
import { createUnsubscribeToken, parseUnsubscribeToken } from '../lib/email/tokens'
import {
  getFounderTestEmail,
  getFounderTestUserId,
  isEmailTestMode,
} from '../lib/email/agents/config'
import { getCompanyMailingAddress } from '../lib/email/constants'

type Check = { name: string; ok: boolean; detail?: string }

function check(name: string, ok: boolean, detail?: string): Check {
  return { name, ok, detail }
}

async function main() {
  loadAccessEnv()
  const checks: Check[] = []
  const founderEmail = getFounderTestEmail()
  const founderId = getFounderTestUserId()

  checks.push(check('EMAIL_UNSUBSCRIBE_SECRET configured', !!process.env.EMAIL_UNSUBSCRIBE_SECRET?.trim()))
  checks.push(check('INTERNAL_EMAIL_API_SECRET configured', !!process.env.INTERNAL_EMAIL_API_SECRET?.trim()))
  checks.push(check('RESEND_API_KEY configured', !!process.env.RESEND_API_KEY?.trim()))
  checks.push(check('FOUNDER_TEST_EMAIL configured', !!founderEmail))
  checks.push(check('FOUNDER_TEST_USER_ID configured', !!founderId))
  checks.push(check('EMAIL_TEST_MODE active', isEmailTestMode()))

  const supabase = createSupabaseAdmin()
  checks.push(check('Supabase admin configured', !!supabase))

  if (supabase) {
    const { error: queueErr } = await supabase.from('email_send_queue').select('id').limit(1)
    checks.push(check('email_send_queue table', !queueErr, queueErr?.message))

    const { error: logErr } = await supabase.from('email_delivery_logs').select('id').limit(1)
    checks.push(check('email_delivery_logs table', !logErr, logErr?.message))
  }

  const token = founderEmail
    ? createUnsubscribeToken({ email: founderEmail, category: 'daily_brief' })
    : null
  checks.push(check('Unsubscribe token generation', !!token))
  checks.push(check('Unsubscribe token parse', !!token && !!parseUnsubscribeToken(token)))

  try {
    const { intake, source } = await resolveDailyBriefIntake({ publishSnapshot: false })
    const routed = routeEmailIntake(intake)
    const draft = generateEmailDraft(routed, intake, founderEmail ? { email: founderEmail, user_id: founderId ?? '' } : undefined)
    const compliance = validateEmailCompliance({
      draft,
      transactional_or_marketing: routed.transactional_or_marketing,
    })
    checks.push(check('Daily brief compliance', compliance.compliant, compliance.violations.join(', ') || source))
  } catch (e) {
    checks.push(check('Daily brief intake', false, e instanceof Error ? e.message : String(e)))
  }

  const snapshot = await fetchDailyBriefSnapshot()
  checks.push(check('Supabase daily brief snapshot', !!snapshot, snapshot?.published_at))

  const connectorIntake = {
    source_type: 'connector_event' as const,
    source_id: `verify-connector-${Date.now()}`,
    payload: {
      user_id: founderId,
      email: founderEmail,
      handle: 'jdwhite.access',
      connector_name: 'Verify Test Connector',
      detected_at: new Date().toISOString(),
    },
  }
  const connectorRoute = routeEmailIntake(connectorIntake)
  const connectorDraft = generateEmailDraft(connectorRoute, connectorIntake, {
    email: founderEmail ?? 'test@example.com',
    user_id: founderId ?? '',
  })
  const connectorCompliance = validateEmailCompliance({
    draft: connectorDraft,
    transactional_or_marketing: 'transactional',
  })
  checks.push(
    check('Connector alert compliance', connectorCompliance.compliant, connectorCompliance.violations.join(', '))
  )

  if (founderEmail && founderId) {
    const txGate = await checkPreferenceGate({
      user_id: founderId,
      email: founderEmail,
      category: 'connector_offline',
      transactional_or_marketing: 'transactional',
    })
    checks.push(check('Transactional bypasses preference gate', txGate.eligible, txGate.reason))

    const partnerIntake = {
      source_type: 'partner_offer' as const,
      source_id: `verify-partner-${Date.now()}`,
      payload: {
        partner_name: 'Verify Partner',
        partner_offer: 'Test offer',
        benefit: 'Verification only',
      },
    }
    const partnerResult = await runEmailIntakePipeline(partnerIntake)
    checks.push(
      check(
        'Partner offer pipeline (opt-in gate)',
        partnerResult.ok || partnerResult.skipped > 0,
        `queued=${partnerResult.queued} skipped=${partnerResult.skipped}`
      )
    )
  }

  const mailing = getCompanyMailingAddress()
  checks.push(
    check(
      'Mailing address (optional until batch)',
      true,
      mailing.startsWith('[Insert')
        ? 'WARN: set COMPANY_MAILING_ADDRESS before EMAIL_TEST_MODE=false'
        : mailing.slice(0, 40)
    )
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (appUrl && token) {
    try {
      const res = await fetch(`${appUrl.replace(/\/$/, '')}/api/email/unsubscribe?token=${encodeURIComponent(token)}`)
      const json = (await res.json()) as { preview?: unknown; error?: string }
      checks.push(check('Production unsubscribe API', res.ok, res.ok ? 'preview ok' : json.error))
    } catch (e) {
      checks.push(check('Production unsubscribe API', false, e instanceof Error ? e.message : String(e)))
    }
  }

  const failed = checks.filter((c) => !c.ok)
  console.log(JSON.stringify({ ok: failed.length === 0, checks }, null, 2))

  if (failed.length) {
    console.error(`\n[email:verify] ${failed.length} check(s) failed.`)
    process.exit(1)
  }

  console.log('\n[email:verify] All checks passed.')
}

main().catch((err) => {
  console.error('[email:verify]', err instanceof Error ? err.message : err)
  process.exit(1)
})
