import type { MarketingEmailCategory } from '@/lib/email/constants'

export type EmailAgentType =
  | 'daily_brief'
  | 'weekly_digest'
  | 'product_update'
  | 'founder_note'
  | 'educational_content'
  | 'partner_offer'
  | 'connector_alert'
  | 'sync_failure'

export type TransactionalOrMarketing = 'transactional' | 'marketing'

export type EmailQueueStatus =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'skipped'
  | 'blocked'

export type EmailDeliveryStatus =
  | 'queued'
  | 'sent'
  | 'failed'
  | 'skipped'
  | 'blocked'
  | 'unsubscribed'
  | 'bounced'
  | 'complained'

export type EmailIntakeSourceType =
  | 'access_intelligence_dossier'
  | 'jdai_dossier'
  | 'jdai_claude_packet'
  | 'product_release'
  | 'founder_note'
  | 'educational_topic'
  | 'partner_offer'
  | 'connector_event'
  | 'sync_event'
  | 'manual'

export interface EmailIntakePayload {
  source_type: EmailIntakeSourceType
  source_path?: string
  source_id?: string
  payload: Record<string, unknown>
  submitted_at?: string
  submitted_by?: string
}

export interface IntakeRouteResult {
  email_type: EmailAgentType
  category: MarketingEmailCategory | 'connector_offline' | 'sync_failure'
  transactional_or_marketing: TransactionalOrMarketing
  priority: 'low' | 'normal' | 'high' | 'critical'
  target_audience: string
  required_send_window: 'immediate' | 'scheduled' | 'batch'
  routed_agent: string
  routing_reason: string
}

export interface EmailDraft {
  subject: string
  preview_text: string
  html_body: string
  text_body: string
  metadata: Record<string, unknown>
}

export interface ComplianceResult {
  compliant: boolean
  violations: string[]
  required_fixes: string[]
  classification: TransactionalOrMarketing
}

export interface PreferenceGateResult {
  eligible: boolean
  reason: string
}

export interface AudienceRecipient {
  user_id: string
  email: string
  clerk_user_id?: string
  handle?: string
  segment: string
}

export interface SchedulerResult {
  scheduled_for: string
  send_window: string
  batch_mode: 'founder_test' | 'small_batch' | 'production_batch'
  idempotency_key: string
}

export interface EmailSendQueueRow {
  id: string
  user_id: string | null
  email: string
  email_type: string
  category: string
  subject: string | null
  preview_text: string | null
  html_body: string | null
  text_body: string | null
  scheduled_for: string | null
  status: EmailQueueStatus
  provider_message_id: string | null
  blocked_reason: string | null
  idempotency_key: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface EmailDeliveryLogRow {
  id: string
  send_queue_id: string | null
  user_id: string | null
  email: string
  email_type: string | null
  category: string | null
  status: EmailDeliveryStatus
  provider_message_id: string | null
  error_message: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface PipelineResult {
  ok: boolean
  routed: IntakeRouteResult
  draft?: EmailDraft
  compliance?: ComplianceResult
  queued: number
  skipped: number
  blocked: number
  errors: string[]
  queue_ids: string[]
}
