/**
 * THE MODE — Autonomous brief scheduler.
 *
 * Runs inside the Slack bot process. Fires daily research + send at 7 AM ET
 * without any manual trigger. Posts a Slack DM when complete.
 *
 * Topic rotation covers the full JD empire across the week.
 * Weekends run lighter signals — can be disabled with SCHEDULER_WEEKDAYS_ONLY=true.
 */
import { runClaudeResearch, sendDailyBrief } from '../lib/operator/pipeline'
import { loadBriefForReview } from '../lib/operator/load-brief-preview'

// ─── Topic rotation ──────────────────────────────────────────────────────────

const THE_MODE_TOPICS: Record<number, string> = {
  0: 'Sunday preview: emerging opportunities and early signals setting up the week ahead — markets, culture, and operator moves',
  1: 'AI infrastructure, automation tools, and systems intelligence for strategic operators — Monday edition',
  2: 'Creator economy, content monetization, and audience-building signals — Tuesday intelligence',
  3: 'Market intelligence: ETFs, investing signals, and wealth-building moves for operators — Wednesday brief',
  4: 'Music industry, entertainment business, cultural brand signals, and IP economy — Thursday edition',
  5: 'Weekly synthesis: systems, strategy, and the highest-leverage moves for a multi-arm empire — Friday brief',
  6: 'Weekend edge: global signals, emerging categories, and early reads on next week',
}

function todaysTopic(): string {
  const override = process.env.ACCESS_MORNING_TOPIC?.trim()
  if (override) return override
  const day = new Date().getUTCDay()
  return THE_MODE_TOPICS[day] ?? THE_MODE_TOPICS[1]
}

// ─── Schedule logic ───────────────────────────────────────────────────────────

// 11:00 UTC = 7:00 AM ET in summer (EDT, UTC-4)
// 12:00 UTC = 7:00 AM ET in winter (EST, UTC-5)
// Railway cron recommendation: run at 11 UTC April–Oct, 12 UTC Nov–Mar.
// We fire on BOTH to be safe — lastFiredDate prevents double-send.
function isScheduledWindow(now: Date): boolean {
  const h = now.getUTCHours()
  const m = now.getUTCMinutes()
  return (h === 11 || h === 12) && m === 0
}

function isWeekend(now: Date): boolean {
  const d = now.getUTCDay()
  return d === 0 || d === 6
}

// ─── Core run ────────────────────────────────────────────────────────────────

async function runTheModeBrief(notify: (msg: string) => Promise<void>): Promise<void> {
  const topic = todaysTopic()
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', timeZone: 'America/New_York',
  })

  console.log(`[scheduler] THE MODE firing — ${date} — topic: "${topic.slice(0, 80)}…"`)
  await notify(`*THE MODE* is running.\n_${date}_\nTopic: ${topic.slice(0, 120)}…`)

  // 1. Research
  const research = await runClaudeResearch(topic)
  if (!research.ok || !research.jsonPath) {
    const msg = `✗ THE MODE research failed.\n${research.message.slice(0, 400)}`
    console.error('[scheduler]', msg)
    await notify(msg)
    return
  }

  // 2. Load preview (validates the dossier is readable)
  const preview = await loadBriefForReview({ dossierPath: research.jsonPath })
  if (!preview.ok) {
    await notify(`✗ THE MODE dossier unreadable after research.\nSay \`brief on ${topic.split(' ').slice(0, 3).join(' ')}\` to retry preview.`)
    return
  }

  // 3. Send — founder mode, immediate, no quality gate
  const result = await sendDailyBrief({ dossierPath: research.jsonPath })
  if (!result.ok) {
    const msg = `✗ THE MODE brief send failed.\n${result.error ?? 'unknown error'}`
    console.error('[scheduler]', msg)
    await notify(msg)
    return
  }

  const successMsg = [
    `✓ *THE MODE* brief sent.`,
    `• Date: ${date}`,
    `• Topic: ${preview.preview.topic}`,
    `• ID: \`${result.source_id}\``,
    `• Delivered: ${result.sent ?? 0}`,
    '',
    '_Check your inbox._',
  ].join('\n')

  console.log('[scheduler]', successMsg.replace(/\*/g, ''))
  await notify(successMsg)
}

// ─── Scheduler entry point ────────────────────────────────────────────────────

export function startAutonomousScheduler(options: {
  sendToSlack: (message: string) => Promise<void>
}): void {
  const { sendToSlack } = options
  const weekdaysOnly = process.env.SCHEDULER_WEEKDAYS_ONLY === 'true'

  let lastFiredDate = ''

  setInterval(async () => {
    try {
      const now = new Date()
      if (!isScheduledWindow(now)) return

      const todayKey = now.toISOString().slice(0, 10)
      if (lastFiredDate === todayKey) return // already fired today
      lastFiredDate = todayKey

      if (weekdaysOnly && isWeekend(now)) {
        console.log('[scheduler] Weekend — skipping (SCHEDULER_WEEKDAYS_ONLY=true)')
        return
      }

      await runTheModeBrief(sendToSlack)
    } catch (err) {
      console.error('[scheduler] Uncaught error in scheduled job:', err)
    }
  }, 60_000) // check every minute

  const mode = weekdaysOnly ? 'weekdays only' : 'daily'
  console.log(`[scheduler] THE MODE autonomous brief active — 7 AM ET, ${mode}`)
}
