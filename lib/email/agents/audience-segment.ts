import { createSupabaseAdmin } from '@/lib/supabase'
import { clerkClient } from '@clerk/nextjs/server'
import type { AudienceRecipient, IntakeRouteResult } from '@/lib/email/agents/types'
import {
  getFounderTestEmail,
  getFounderTestUserId,
  isEmailTestMode,
  isFounderTestRecipient,
} from '@/lib/email/agents/config'
import { checkPreferenceGate } from '@/lib/email/agents/preference-gate'
import type { MarketingEmailCategory } from '@/lib/email/constants'

async function resolveEmail(clerkUserId: string): Promise<string | null> {
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(clerkUserId)
    const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
    return primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null
  } catch {
    return null
  }
}

export async function selectAudienceRecipients(
  route: IntakeRouteResult,
  options?: { explicitRecipients?: AudienceRecipient[] }
): Promise<{ recipients: AudienceRecipient[]; skipped: AudienceRecipient[] }> {
  if (options?.explicitRecipients?.length) {
    const recipients: AudienceRecipient[] = []
    const skipped: AudienceRecipient[] = []

    for (const r of options.explicitRecipients) {
      if (isEmailTestMode() && !isFounderTestRecipient(r.user_id, r.email)) {
        skipped.push({ ...r, segment: 'skipped_test_mode' })
        continue
      }
      const gate = await checkPreferenceGate({
        user_id: r.user_id,
        email: r.email,
        category: route.category as MarketingEmailCategory,
        transactional_or_marketing: route.transactional_or_marketing,
      })
      if (!gate.eligible) {
        skipped.push({ ...r, segment: `ineligible:${gate.reason}` })
        continue
      }
      recipients.push(r)
    }
    return { recipients, skipped }
  }

  if (route.transactional_or_marketing === 'transactional') {
    return { recipients: [], skipped: [] }
  }

  if (isEmailTestMode()) {
    const founderId = getFounderTestUserId()
    const founderEmail = getFounderTestEmail()
    if (founderId && founderEmail) {
      return {
        recipients: [
          {
            user_id: founderId,
            email: founderEmail,
            segment: 'founder_test',
          },
        ],
        skipped: [],
      }
    }
    return { recipients: [], skipped: [] }
  }

  const supabase = createSupabaseAdmin()
  if (!supabase) return { recipients: [], skipped: [] }

  const prefField = categoryToPrefField(route.category)
  if (!prefField) return { recipients: [], skipped: [] }

  const { data: prefs } = await supabase
    .from('email_preferences')
    .select('user_id')
    .eq('marketing_paused', false)
    .eq(prefField, true)
    .limit(500)

  const recipients: AudienceRecipient[] = []
  const skipped: AudienceRecipient[] = []

  for (const row of prefs ?? []) {
    const { data: identity } = await supabase
      .from('access_identities')
      .select('id, clerk_user_id, handle')
      .eq('id', row.user_id)
      .maybeSingle()

    if (!identity) continue

    const email = await resolveEmail(identity.clerk_user_id)
    if (!email) continue

    const gate = await checkPreferenceGate({
      user_id: identity.id,
      email,
      category: route.category as MarketingEmailCategory,
      transactional_or_marketing: route.transactional_or_marketing,
    })

    const base: AudienceRecipient = {
      user_id: identity.id,
      email,
      clerk_user_id: identity.clerk_user_id,
      handle: identity.handle,
      segment: route.target_audience,
    }

    if (!gate.eligible) {
      skipped.push({ ...base, segment: `ineligible:${gate.reason}` })
    } else {
      recipients.push(base)
    }
  }

  return { recipients, skipped }
}

function categoryToPrefField(category: string): string | null {
  const map: Record<string, string> = {
    daily_brief: 'daily_brief_enabled',
    weekly_digest: 'weekly_digest_enabled',
    product_updates: 'product_updates_enabled',
    founder_notes: 'founder_notes_enabled',
    educational_content: 'educational_content_enabled',
    partner_offers: 'partner_offers_enabled',
  }
  return map[category] ?? null
}
