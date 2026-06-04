import type { ComplianceResult, EmailDraft, TransactionalOrMarketing } from '@/lib/email/agents/types'
import { getAppBaseUrl, COMPANY_MAILING_ADDRESS_PLACEHOLDER } from '@/lib/email/constants'

export function validateEmailCompliance(input: {
  draft: EmailDraft
  transactional_or_marketing: TransactionalOrMarketing
  promotional_cta_allowed?: boolean
}): ComplianceResult {
  const violations: string[] = []
  const { draft, transactional_or_marketing } = input
  const html = draft.html_body ?? ''
  const base = getAppBaseUrl()

  if (!draft.subject?.trim()) violations.push('missing_subject')
  if (!html.trim()) violations.push('missing_html_body')

  if (transactional_or_marketing === 'marketing') {
    if (!html.includes('/unsubscribe') && !html.includes('Unsubscribe')) {
      violations.push('missing_unsubscribe_link')
    }
    if (!html.includes('/settings/notifications-email') && !html.includes('Manage email preferences')) {
      violations.push('missing_manage_preferences_link')
    }
    if (!html.includes('/privacy')) violations.push('missing_privacy_link')
    if (!html.includes('/terms')) violations.push('missing_terms_link')
    if (!html.includes(COMPANY_MAILING_ADDRESS_PLACEHOLDER) && !html.includes('mailing address')) {
      violations.push('missing_mailing_address')
    }
    if (!draft.metadata?.category) violations.push('missing_category_metadata')
  } else {
    const supportOk =
      html.includes('/settings') ||
      html.includes('/dashboard') ||
      html.includes('support') ||
      html.includes(base)
    if (!supportOk) violations.push('missing_support_or_account_link')

    const hasPromoCta =
      html.includes('linear-gradient') ||
      /buy now|limited time|discount|sale/i.test(html)
    if (hasPromoCta && !input.promotional_cta_allowed) {
      violations.push('promotional_cta_not_allowed_on_transactional')
    }
    if (!draft.metadata?.category) violations.push('missing_category_metadata')
  }

  return {
    compliant: violations.length === 0,
    violations,
    required_fixes: violations.map((v) => `fix:${v}`),
    classification: transactional_or_marketing,
  }
}
