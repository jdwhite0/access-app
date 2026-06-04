import type { IntakeRouteResult, SchedulerResult } from '@/lib/email/agents/types'
import { isEmailTestMode } from '@/lib/email/agents/config'
import { createHash } from 'crypto'

function nextWeekdayMorning(): Date {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + (d.getUTCHours() >= 12 ? 1 : 0))
  d.setUTCHours(12, 0, 0, 0) // 07:00 US Eastern approx via UTC noon scheduling placeholder
  return d
}

function nextMondayMorning(): Date {
  const d = new Date()
  const day = d.getUTCDay()
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 7 : 8 - day
  d.setUTCDate(d.getUTCDate() + daysUntilMonday)
  d.setUTCHours(13, 0, 0, 0)
  return d
}

export function scheduleEmailSend(
  route: IntakeRouteResult,
  context: { user_id?: string; email_type?: string; source_id?: string }
): SchedulerResult {
  const now = new Date()
  let scheduled = new Date(now)

  // Founder test mode + manual runs: queue for immediate dispatch
  if (isEmailTestMode() || route.required_send_window === 'immediate') {
    scheduled = now
  } else {
    switch (route.email_type) {
      case 'daily_brief':
        scheduled = nextWeekdayMorning()
        break
      case 'weekly_digest':
        scheduled = nextMondayMorning()
        break
      default:
        scheduled = new Date(now.getTime() + 15 * 60 * 1000)
    }
  }

  const idempotencyKey = createHash('sha256')
    .update(
      [
        route.email_type,
        context.source_id ?? '',
        context.user_id ?? 'batch',
        scheduled.toISOString().slice(0, 10),
      ].join(':')
    )
    .digest('hex')
    .slice(0, 32)

  return {
    scheduled_for: scheduled.toISOString(),
    send_window: route.required_send_window,
    batch_mode: isEmailTestMode() ? 'founder_test' : 'production_batch',
    idempotency_key: idempotencyKey,
  }
}
