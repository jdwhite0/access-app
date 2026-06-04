import { createSupabaseAdmin } from '@/lib/supabase'

export async function logEmailConsent(input: {
  userId?: string | null
  email: string
  consentType: string
  consentStatus: 'granted' | 'denied' | 'withdrawn'
  source: string
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return

  await supabase.from('email_consent_log').insert({
    user_id: input.userId ?? null,
    email: input.email.toLowerCase().trim(),
    consent_type: input.consentType,
    consent_status: input.consentStatus,
    source: input.source,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
  })
}
