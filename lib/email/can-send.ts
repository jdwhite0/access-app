/**
 * Marketing send gate — transactional emails MUST bypass this module.
 * Checks: marketing_paused, per-category toggles, frequency, recent unsubscribe events.
 */

import { createSupabaseAdmin } from '@/lib/supabase'
import type { MarketingEmailCategory, TransactionalEmailCategory } from '@/lib/email/constants'
import type { EmailPreferencesRow } from '@/types/email'

const CATEGORY_TO_PREFERENCE_FIELD: Record<
  MarketingEmailCategory,
  keyof Pick<
    EmailPreferencesRow,
    | 'daily_brief_enabled'
    | 'weekly_digest_enabled'
    | 'product_updates_enabled'
    | 'founder_notes_enabled'
    | 'educational_content_enabled'
    | 'partner_offers_enabled'
  >
> = {
  daily_brief: 'daily_brief_enabled',
  weekly_digest: 'weekly_digest_enabled',
  product_updates: 'product_updates_enabled',
  founder_notes: 'founder_notes_enabled',
  educational_content: 'educational_content_enabled',
  partner_offers: 'partner_offers_enabled',
}
import { getPreferencesByIdentityId } from '@/lib/email/preferences-db'
import type { SendEmailKind } from '@/types/email'

const TRANSACTIONAL_IDS = new Set<string>([
  'email_verification',
  'password_reset',
  'login_security',
  'billing_receipt',
  'subscription_change',
  'connector_offline',
  'sync_failure',
])

export type CanSendResult =
  | { allowed: true; reason: 'transactional' | 'marketing_ok' }
  | { allowed: false; reason: string }

function frequencyAllows(
  prefs: EmailPreferencesRow,
  category: MarketingEmailCategory
): boolean {
  if (prefs.marketing_paused || prefs.frequency === 'paused') return false

  switch (prefs.frequency) {
    case 'daily':
      return true
    case 'weekly':
      return category === 'weekly_digest' || category === 'product_updates'
    case 'major_updates_only':
      return category === 'product_updates' || category === 'founder_notes'
    default:
      return true
  }
}

async function hasActiveUnsubscribe(email: string, category: MarketingEmailCategory): Promise<boolean> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return false

  const normalized = email.toLowerCase().trim()
  const { data } = await supabase
    .from('email_unsubscribe_events')
    .select('category')
    .eq('email', normalized)
    .in('category', [category, 'all_marketing'])
    .order('created_at', { ascending: false })
    .limit(20)

  return (data?.length ?? 0) > 0
}

export async function canSendEmail(input: {
  kind: SendEmailKind
  category: MarketingEmailCategory | TransactionalEmailCategory
  email: string
  identityId?: string | null
}): Promise<CanSendResult> {
  if (input.kind === 'transactional' || TRANSACTIONAL_IDS.has(input.category)) {
    return { allowed: true, reason: 'transactional' }
  }

  const marketingCategory = input.category as MarketingEmailCategory

  if (await hasActiveUnsubscribe(input.email, marketingCategory)) {
    return { allowed: false, reason: 'unsubscribed' }
  }

  if (!input.identityId) {
    return { allowed: false, reason: 'no_preferences' }
  }

  const prefs = await getPreferencesByIdentityId(input.identityId)
  if (!prefs) {
    return { allowed: false, reason: 'no_preferences' }
  }

  if (prefs.marketing_paused) {
    return { allowed: false, reason: 'marketing_paused' }
  }

  const field = CATEGORY_TO_PREFERENCE_FIELD[marketingCategory]
  if (!prefs[field]) {
    return { allowed: false, reason: 'category_disabled' }
  }

  if (!frequencyAllows(prefs, marketingCategory)) {
    return { allowed: false, reason: 'frequency' }
  }

  return { allowed: true, reason: 'marketing_ok' }
}
