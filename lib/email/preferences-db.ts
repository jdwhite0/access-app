import { createSupabaseAdmin } from '@/lib/supabase'
import type { EmailPreferencesRow, UpdateEmailPreferencesInput } from '@/types/email'
import type { EmailFrequency } from '@/lib/email/constants'

const DEFAULT_PREFS = {
  daily_brief_enabled: true,
  weekly_digest_enabled: true,
  product_updates_enabled: true,
  founder_notes_enabled: true,
  educational_content_enabled: true,
  partner_offers_enabled: false,
  marketing_paused: false,
  frequency: 'daily' as EmailFrequency,
}

export async function getPreferencesByIdentityId(
  identityId: string
): Promise<EmailPreferencesRow | null> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return null

  const { data } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('user_id', identityId)
    .maybeSingle()

  return (data as EmailPreferencesRow | null) ?? null
}

export async function ensureEmailPreferences(
  identityId: string,
  overrides?: Partial<typeof DEFAULT_PREFS>
): Promise<EmailPreferencesRow | null> {
  const existing = await getPreferencesByIdentityId(identityId)
  if (existing) return existing

  const supabase = createSupabaseAdmin()
  if (!supabase) return null

  const row = { user_id: identityId, ...DEFAULT_PREFS, ...overrides }
  const { data, error } = await supabase
    .from('email_preferences')
    .insert(row)
    .select('*')
    .single()

  if (error) {
    const retry = await getPreferencesByIdentityId(identityId)
    return retry
  }
  return data as EmailPreferencesRow
}

export async function updateEmailPreferences(
  identityId: string,
  patch: UpdateEmailPreferencesInput
): Promise<{ prefs: EmailPreferencesRow | null; error?: string }> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return { prefs: null, error: 'Database not configured.' }

  await ensureEmailPreferences(identityId)

  if (patch.frequency === 'paused') {
    patch.marketing_paused = true
  } else if (patch.frequency) {
    patch.marketing_paused = false
  }

  const { data, error } = await supabase
    .from('email_preferences')
    .update(patch)
    .eq('user_id', identityId)
    .select('*')
    .single()

  if (error) return { prefs: null, error: error.message }
  return { prefs: data as EmailPreferencesRow }
}

export async function applyMarketingOptInFromSignup(
  identityId: string,
  optIn: boolean
): Promise<void> {
  if (optIn) {
    await ensureEmailPreferences(identityId)
    return
  }

  await ensureEmailPreferences(identityId, {
    daily_brief_enabled: false,
    weekly_digest_enabled: false,
    product_updates_enabled: false,
    founder_notes_enabled: false,
    educational_content_enabled: false,
    partner_offers_enabled: false,
    marketing_paused: true,
    frequency: 'paused',
  })
}

export async function applyUnsubscribeToPreferences(
  identityId: string,
  category: string
): Promise<void> {
  const prefs = await ensureEmailPreferences(identityId)
  if (!prefs) return

  if (category === 'all_marketing') {
    await updateEmailPreferences(identityId, {
      marketing_paused: true,
      frequency: 'paused',
      daily_brief_enabled: false,
      weekly_digest_enabled: false,
      product_updates_enabled: false,
      founder_notes_enabled: false,
      educational_content_enabled: false,
      partner_offers_enabled: false,
    })
    return
  }

  const fieldMap: Record<string, keyof UpdateEmailPreferencesInput> = {
    daily_brief: 'daily_brief_enabled',
    weekly_digest: 'weekly_digest_enabled',
    product_updates: 'product_updates_enabled',
    founder_notes: 'founder_notes_enabled',
    educational_content: 'educational_content_enabled',
    partner_offers: 'partner_offers_enabled',
  }
  const field = fieldMap[category]
  if (field) {
    await updateEmailPreferences(identityId, { [field]: false } as UpdateEmailPreferencesInput)
  }
}
