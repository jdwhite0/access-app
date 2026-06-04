import { createSupabaseAdmin } from '@/lib/supabase'
import { logEmailConsent } from '@/lib/email/consent'
import { applyUnsubscribeToPreferences } from '@/lib/email/preferences-db'
import { parseUnsubscribeToken } from '@/lib/email/tokens'
import type { UnsubscribeCategory } from '@/lib/email/constants'

export type UnsubscribePreview = {
  email: string
  category: UnsubscribeCategory
  categoryLabel: string
}

const CATEGORY_LABELS: Record<string, string> = {
  daily_brief: 'ACCESS Daily Brief',
  weekly_digest: 'Weekly Digest',
  product_updates: 'Product Updates',
  founder_notes: 'Founder Notes',
  educational_content: 'Educational Content',
  partner_offers: 'Partner Offers',
  all_marketing: 'all marketing emails',
}

export function previewUnsubscribeToken(token: string): UnsubscribePreview | null {
  const payload = parseUnsubscribeToken(token)
  if (!payload) return null
  return {
    email: payload.email,
    category: payload.category,
    categoryLabel: CATEGORY_LABELS[payload.category] ?? payload.category,
  }
}

async function resolveIdentityIdByEmail(email: string): Promise<string | null> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return null

  const { data } = await supabase
    .from('email_consent_log')
    .select('user_id')
    .eq('email', email.toLowerCase().trim())
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data?.user_id as string | null) ?? null
}

export async function executeUnsubscribe(input: {
  token: string
  scope: 'category' | 'all_marketing'
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<{ ok: boolean; error?: string; email?: string }> {
  const payload = parseUnsubscribeToken(input.token)
  if (!payload) return { ok: false, error: 'Invalid or expired unsubscribe link.' }

  const category =
    input.scope === 'all_marketing' ? 'all_marketing' : payload.category

  const supabase = createSupabaseAdmin()
  if (!supabase) return { ok: false, error: 'Service unavailable.' }

  const identityId = await resolveIdentityIdByEmail(payload.email)

  await supabase.from('email_unsubscribe_events').insert({
    user_id: identityId,
    email: payload.email,
    category,
    unsubscribe_token: input.token,
    source: 'public_unsubscribe',
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
  })

  if (identityId) {
    await applyUnsubscribeToPreferences(identityId, category)
  }

  await logEmailConsent({
    userId: identityId,
    email: payload.email,
    consentType: `unsubscribe_${category}`,
    consentStatus: 'withdrawn',
    source: 'unsubscribe',
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent,
  })

  return { ok: true, email: payload.email }
}
