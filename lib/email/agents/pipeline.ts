import { routeEmailIntake } from '@/lib/email/agents/intake-router'
import { generateEmailDraft } from '@/lib/email/agents/generate-draft'
import { validateEmailCompliance } from '@/lib/email/agents/compliance'
import { selectAudienceRecipients } from '@/lib/email/agents/audience-segment'
import { scheduleEmailSend } from '@/lib/email/agents/scheduler'
import { insertQueueItem, insertSkippedQueueItem } from '@/lib/email/agents/queue-db'
import { logEmailDelivery } from '@/lib/email/agents/delivery-log-db'
import { isFounderTestRecipient, isEmailTestMode, getFounderTestEmail, getFounderTestUserId } from '@/lib/email/agents/config'
import type { AudienceRecipient, EmailIntakePayload, PipelineResult } from '@/lib/email/agents/types'
import { sendAccessEmail } from '@/lib/email/sender'
import { fetchDueQueueItems, updateQueueStatus, countQueuedItems } from '@/lib/email/agents/queue-db'
import type { MarketingEmailCategory } from '@/lib/email/constants'
import type { TransactionalEmailCategory } from '@/lib/email/constants'

function resolvePreviewRecipient(
  route: ReturnType<typeof routeEmailIntake>,
  intake: EmailIntakePayload
): AudienceRecipient | undefined {
  const p = intake.payload ?? {}
  if (p.email && typeof p.email === 'string') {
    return {
      user_id: String(p.user_id ?? ''),
      email: p.email,
      handle: typeof p.handle === 'string' ? p.handle : undefined,
      segment: 'payload',
    }
  }

  if (route.transactional_or_marketing === 'transactional') {
    return undefined
  }

  if (isEmailTestMode()) {
    const founderId = getFounderTestUserId()
    const founderEmail = getFounderTestEmail()
    if (founderId && founderEmail) {
      return {
        user_id: founderId,
        email: founderEmail,
        handle: typeof p.handle === 'string' ? p.handle : undefined,
        segment: 'founder_test',
      }
    }
  }

  return undefined
}

export async function runEmailIntakePipeline(
  intake: EmailIntakePayload,
  options?: { explicitRecipients?: AudienceRecipient[]; sendImmediately?: boolean }
): Promise<PipelineResult> {
  const errors: string[] = []
  const queue_ids: string[] = []
  let queued = 0
  let skipped = 0
  let blocked = 0

  const routed = routeEmailIntake(intake)

  const previewRecipient =
    options?.explicitRecipients?.[0] ?? resolvePreviewRecipient(routed, intake)

  const draft = generateEmailDraft(routed, intake, previewRecipient)

  const compliance = validateEmailCompliance({
    draft,
    transactional_or_marketing: routed.transactional_or_marketing,
    promotional_cta_allowed: intake.payload?.promotional_cta_allowed === true,
  })

  if (!compliance.compliant) {
    return {
      ok: false,
      routed,
      draft,
      compliance,
      queued: 0,
      skipped: 0,
      blocked: 1,
      errors: compliance.violations,
      queue_ids: [],
    }
  }

  let recipients: AudienceRecipient[] = []
  let skippedRecipients: AudienceRecipient[] = []

  if (routed.transactional_or_marketing === 'transactional') {
    const p = intake.payload
    const explicit: AudienceRecipient = {
      user_id: String(p.user_id ?? ''),
      email: String(p.email ?? ''),
      segment: 'affected_user',
    }
    recipients = explicit.email ? [explicit] : []
  } else {
    const seg = await selectAudienceRecipients(routed, {
      explicitRecipients: options?.explicitRecipients,
    })
    recipients = seg.recipients
    skippedRecipients = seg.skipped
  }

  for (const s of skippedRecipients) {
    skipped++
    await insertSkippedQueueItem({
      user_id: s.user_id,
      email: s.email,
      email_type: routed.email_type,
      category: routed.category,
      subject: draft.subject,
      blocked_reason: s.segment,
      metadata: { intake: intake.source_id },
    })
    await logEmailDelivery({
      user_id: s.user_id,
      email: s.email,
      email_type: routed.email_type,
      category: routed.category,
      status: 'skipped',
      metadata: { reason: s.segment },
    })
  }

  if (recipients.length === 0 && routed.transactional_or_marketing === 'marketing') {
    return {
      ok: true,
      routed,
      draft,
      compliance,
      queued: 0,
      skipped,
      blocked,
      errors: ['no_eligible_recipients'],
      queue_ids,
    }
  }

  for (const recipient of recipients) {
    if (isEmailTestMode() && !isFounderTestRecipient(recipient.user_id, recipient.email)) {
      skipped++
      await insertSkippedQueueItem({
        user_id: recipient.user_id,
        email: recipient.email,
        email_type: routed.email_type,
        category: routed.category,
        subject: draft.subject,
        blocked_reason: 'skipped_test_mode',
      })
      continue
    }

    const personalDraft = generateEmailDraft(routed, intake, recipient)
    const schedule = scheduleEmailSend(routed, {
      user_id: recipient.user_id,
      source_id: intake.source_id,
    })

    const scheduledFor =
      options?.sendImmediately || routed.required_send_window === 'immediate'
        ? new Date().toISOString()
        : schedule.scheduled_for

    const { row, error, duplicate } = await insertQueueItem({
      user_id: recipient.user_id,
      email: recipient.email,
      email_type: routed.email_type,
      category: routed.category,
      subject: personalDraft.subject,
      preview_text: personalDraft.preview_text,
      html_body: personalDraft.html_body,
      text_body: personalDraft.text_body,
      scheduled_for: scheduledFor,
      idempotency_key: `${schedule.idempotency_key}:${recipient.user_id}`,
      metadata: personalDraft.metadata,
    })

    if (error) {
      errors.push(error)
      blocked++
      continue
    }
    if (row) {
      queue_ids.push(row.id)
      if (!duplicate) queued++
      await logEmailDelivery({
        send_queue_id: row.id,
        user_id: recipient.user_id,
        email: recipient.email,
        email_type: routed.email_type,
        category: routed.category,
        status: 'queued',
      })
    }
  }

  return {
    ok: errors.length === 0,
    routed,
    draft,
    compliance,
    queued,
    skipped,
    blocked,
    errors,
    queue_ids,
  }
}

export async function dispatchDueQueuedEmails(limit = 25): Promise<{
  sent: number
  failed: number
  skipped: number
  processed: number
  due_before: number
  queued_total: number
  queue_error?: string
  hint?: string
}> {
  const counts = await countQueuedItems()
  const items = await fetchDueQueueItems(limit)
  let sent = 0
  let failed = 0
  let skipped = 0

  if (counts.error?.includes('email_send_queue') || counts.error?.includes('schema cache')) {
    return {
      sent: 0,
      failed: 0,
      skipped: 0,
      processed: 0,
      due_before: 0,
      queued_total: 0,
      queue_error: counts.error,
      hint: 'Apply access-app/supabase/schema_v7_email_agents.sql in Supabase SQL Editor.',
    }
  }

  if (items.length === 0) {
    return {
      sent: 0,
      failed: 0,
      skipped: 0,
      processed: 0,
      due_before: counts.due,
      queued_total: counts.total,
      hint:
        counts.total > 0
          ? 'Queue has items scheduled for the future — rerun after scheduled_for or run intake again in EMAIL_TEST_MODE (immediate schedule).'
          : 'No queued items — run POST /api/internal/email/intake first (must return ok:true, queued>=1).',
    }
  }

  for (const item of items) {
    await updateQueueStatus(item.id, { status: 'sending' })

    const kind =
      item.category === 'connector_offline' || item.category === 'sync_failure'
        ? 'transactional'
        : 'marketing'

    const result = await sendAccessEmail({
      to: item.email,
      subject: item.subject ?? 'ACCESS',
      html: item.html_body ?? '',
      kind,
      category: item.category as MarketingEmailCategory | TransactionalEmailCategory,
      userId: item.user_id ?? undefined,
    })

    if (!result.ok) {
      if (result.skipped) {
        skipped++
        await updateQueueStatus(item.id, {
          status: 'skipped',
          blocked_reason: result.error,
        })
        await logEmailDelivery({
          send_queue_id: item.id,
          user_id: item.user_id,
          email: item.email,
          email_type: item.email_type,
          category: item.category,
          status: 'skipped',
          error_message: result.error,
        })
        continue
      }

      failed++
      await updateQueueStatus(item.id, { status: 'failed', blocked_reason: result.error })
      await logEmailDelivery({
        send_queue_id: item.id,
        user_id: item.user_id,
        email: item.email,
        email_type: item.email_type,
        category: item.category,
        status: 'failed',
        error_message: result.error,
      })
      continue
    }

    sent++
    await updateQueueStatus(item.id, {
      status: 'sent',
      provider_message_id: result.id ?? null,
    })
    await logEmailDelivery({
      send_queue_id: item.id,
      user_id: item.user_id,
      email: item.email,
      email_type: item.email_type,
      category: item.category,
      status: 'sent',
      provider_message_id: result.id ?? null,
      metadata: { mode: result.mode },
    })
  }

  return {
    sent,
    failed,
    skipped,
    processed: items.length,
    due_before: counts.due,
    queued_total: counts.total,
  }
}
