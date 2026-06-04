import { canSendEmail } from '@/lib/email/can-send'
import type { PreferenceGateResult } from '@/lib/email/agents/types'
import type { MarketingEmailCategory, TransactionalEmailCategory } from '@/lib/email/constants'
import type { TransactionalOrMarketing } from '@/lib/email/agents/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function checkPreferenceGate(input: {
  user_id: string | null
  email: string
  category: MarketingEmailCategory | TransactionalEmailCategory | 'connector_offline' | 'sync_failure'
  transactional_or_marketing: TransactionalOrMarketing
}): Promise<PreferenceGateResult> {
  if (input.transactional_or_marketing === 'transactional') {
    return { eligible: true, reason: 'transactional_bypass' }
  }

  const email = input.email?.trim()
  if (!email || !EMAIL_RE.test(email)) {
    return { eligible: false, reason: 'invalid_email' }
  }

  const marketingCategory = input.category as MarketingEmailCategory

  const gate = await canSendEmail({
    kind: 'marketing',
    category: marketingCategory,
    email,
    identityId: input.user_id,
  })

  if (!gate.allowed) {
    return { eligible: false, reason: gate.reason }
  }

  return { eligible: true, reason: 'marketing_ok' }
}
