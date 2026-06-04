/**
 * Marketing send helpers — always gated by canSendEmail / sendAccessEmail.
 * Wire cron or workers to these functions; do not send marketing email without them.
 */

import { sendAccessEmail } from '@/lib/email/sender'
import { renderDailyBriefEmail } from '@/lib/email/templates/daily-brief'
import { renderWeeklyDigestEmail } from '@/lib/email/templates/weekly-digest'
import { renderProductUpdateEmail } from '@/lib/email/templates/product-update'

export async function sendDailyBrief(input: {
  email: string
  identityId: string
  handle: string
  systemStatus: string
  intelligence: string
  recommendedAction: string
  productTip: string
}) {
  const { subject, html } = renderDailyBriefEmail(input)
  return sendAccessEmail({
    to: input.email,
    subject,
    html,
    kind: 'marketing',
    category: 'daily_brief',
    userId: input.identityId,
  })
}

export async function sendWeeklyDigest(input: {
  email: string
  identityId: string
  handle: string
  highlights: string[]
  weekSummary: string
}) {
  const { subject, html } = renderWeeklyDigestEmail(input)
  return sendAccessEmail({
    to: input.email,
    subject,
    html,
    kind: 'marketing',
    category: 'weekly_digest',
    userId: input.identityId,
  })
}

export async function sendProductUpdate(input: {
  email: string
  identityId: string
  headline: string
  summary: string
  details: string
}) {
  const { subject, html } = renderProductUpdateEmail(input)
  return sendAccessEmail({
    to: input.email,
    subject,
    html,
    kind: 'marketing',
    category: 'product_updates',
    userId: input.identityId,
  })
}
