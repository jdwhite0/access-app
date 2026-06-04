import type { EmailFrequency, MarketingEmailCategory } from '@/lib/email/constants'

export interface EmailPreferencesRow {
  id: string
  user_id: string
  daily_brief_enabled: boolean
  weekly_digest_enabled: boolean
  product_updates_enabled: boolean
  founder_notes_enabled: boolean
  educational_content_enabled: boolean
  partner_offers_enabled: boolean
  marketing_paused: boolean
  frequency: EmailFrequency
  created_at: string
  updated_at: string
}

export interface EmailConsentLogRow {
  id: string
  user_id: string | null
  email: string
  consent_type: string
  consent_status: 'granted' | 'denied' | 'withdrawn'
  source: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface EmailUnsubscribeEventRow {
  id: string
  user_id: string | null
  email: string
  category: string
  unsubscribe_token: string
  source: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export type UpdateEmailPreferencesInput = Partial<
  Pick<
    EmailPreferencesRow,
    | 'daily_brief_enabled'
    | 'weekly_digest_enabled'
    | 'product_updates_enabled'
    | 'founder_notes_enabled'
    | 'educational_content_enabled'
    | 'partner_offers_enabled'
    | 'marketing_paused'
    | 'frequency'
  >
>

export type SendEmailKind = 'transactional' | 'marketing'

export interface SendEmailRequest {
  to: string
  subject: string
  html: string
  kind: SendEmailKind
  category: MarketingEmailCategory | import('@/lib/email/constants').TransactionalEmailCategory
  userId?: string
}

export type { EmailSendQueueRow, EmailDeliveryLogRow } from '@/lib/email/agents/types'
