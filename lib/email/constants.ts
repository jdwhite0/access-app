/**
 * Email compliance — CAN-SPAM / transactional separation
 * - Marketing emails MUST include unsubscribe + manage prefs + legal footer (see templates/footer.ts)
 * - Transactional emails bypass marketing_preferences (see can-send.ts)
 * - Consent changes MUST be logged to email_consent_log
 * - Physical mailing address placeholder MUST be replaced before production sends
 */

export const MARKETING_CONSENT_SESSION_KEY = 'access_marketing_consent_opt_in'

export const EMAIL_FREQUENCY_OPTIONS = [
  'daily',
  'weekly',
  'major_updates_only',
  'paused',
] as const

export type EmailFrequency = (typeof EMAIL_FREQUENCY_OPTIONS)[number]

/** Optional ACCESS Intelligence categories (toggleable). */
export const MARKETING_EMAIL_CATEGORIES = [
  'daily_brief',
  'weekly_digest',
  'product_updates',
  'founder_notes',
  'educational_content',
  'partner_offers',
] as const

export type MarketingEmailCategory = (typeof MARKETING_EMAIL_CATEGORIES)[number]

/** Unsubscribe token may target one category or all marketing. */
export const UNSUBSCRIBE_CATEGORIES = [
  ...MARKETING_EMAIL_CATEGORIES,
  'all_marketing',
] as const

export type UnsubscribeCategory = (typeof UNSUBSCRIBE_CATEGORIES)[number]

/** Required account emails — always sent; cannot be disabled in UI or via unsubscribe. */
export const REQUIRED_TRANSACTIONAL_EMAILS = [
  { id: 'email_verification', label: 'Email verification' },
  { id: 'password_reset', label: 'Password reset' },
  { id: 'login_security', label: 'Login & security alerts' },
  { id: 'billing_receipt', label: 'Billing receipts' },
  { id: 'subscription_change', label: 'Subscription changes' },
  { id: 'connector_offline', label: 'Connector offline alerts' },
  { id: 'sync_failure', label: 'Sync failure alerts' },
] as const

export type TransactionalEmailCategory = (typeof REQUIRED_TRANSACTIONAL_EMAILS)[number]['id']

export const SIGNUP_MARKETING_CONSENT_LABEL =
  'Send me ACCESS Intelligence emails, product updates, and educational content.'

/** Replace before production — CAN-SPAM physical address requirement. */
export const COMPANY_MAILING_ADDRESS_PLACEHOLDER =
  '[Insert company mailing address or registered PO Box]'

export function getAppBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    'http://localhost:3000'
  if (raw.startsWith('http')) return raw.replace(/\/$/, '')
  return `https://${raw.replace(/\/$/, '')}`
}
