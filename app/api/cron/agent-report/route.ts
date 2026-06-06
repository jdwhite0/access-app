import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCronOrInternalAuth } from '@/lib/email/agents/cron-auth'
import { slackPostMessage } from '@/lib/slack/client'
import type { ReportType, PipelineStage, Arm } from '@/lib/revenue-agents/types'
import { REVENUE_TARGET_MONTHLY, TARGET_START_DATE } from '@/lib/revenue-agents/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const REPORT_CHANNEL = process.env.SLACK_REVENUE_CHANNEL ?? process.env.SLACK_CHANNEL ?? '#general'

/**
 * REPORT-2X — Twice-Daily Pipeline Reporter
 * Morning: 7:30am EDT (11:30 UTC)  → ?report_type=MORNING
 * Evening: 5:00pm EDT (21:00 UTC)  → ?report_type=EVENING
 *
 * GET /api/cron/agent-report?report_type=MORNING
 */
export async function GET(request: NextRequest) {
  const denied = verifyCronOrInternalAuth(request)
  if (denied) return denied

  const reportType = (request.nextUrl.searchParams.get('report_type') ?? 'MORNING') as ReportType
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // ── Gather pipeline data ─────────────────────────────────────────
  const { data: allLeads } = await supabase
    .from('pipeline_leads')
    .select('arm, stage, closed_value, flagged_for_jerry, flag_reason, first_name, last_name, email, company, call_booked_at')

  const arms: Arm[] = ['consulting', 'bridge-video', 'access']

  const pipelineSummary = arms.map(arm => {
    const armLeads = allLeads?.filter(l => l.arm === arm) ?? []
    const stageCounts: Partial<Record<PipelineStage, number>> = {}
    for (const lead of armLeads) {
      stageCounts[lead.stage as PipelineStage] = (stageCounts[lead.stage as PipelineStage] ?? 0) + 1
    }
    const mrrClosed = armLeads
      .filter(l => l.stage === 'CLOSED_WON')
      .reduce((sum, l) => sum + (l.closed_value ?? 0), 0)

    return { arm, stageCounts, total: armLeads.length, mrrClosed }
  })

  // ── Gather today's quota status ──────────────────────────────────
  const { data: quotas } = await supabase
    .from('agent_daily_quotas')
    .select('*')
    .eq('date', today)
    .order('agent_code')

  // ── Gather today's activity ──────────────────────────────────────
  const startOfDay = `${today}T00:00:00Z`
  const { data: todayLogs } = await supabase
    .from('agent_activity_logs')
    .select('agent_code, action, arm, success')
    .gte('created_at', startOfDay)

  const leadsFoundToday = todayLogs?.filter(l => l.action === 'LEAD_FOUND' && l.success).length ?? 0
  const outreachSentToday = todayLogs?.filter(l => l.action === 'OUTREACH_SENT' && l.success).length ?? 0
  const followUpsSentToday = todayLogs?.filter(l => l.action?.startsWith('FOLLOW_UP') && l.success).length ?? 0
  const stagesAdvancedToday = todayLogs?.filter(l => l.action === 'STAGE_ADVANCED' && l.success).length ?? 0

  // ── Hot leads needing attention ──────────────────────────────────
  const hotLeads = allLeads?.filter(l => l.flagged_for_jerry) ?? []

  // ── Revenue math ─────────────────────────────────────────────────
  const totalMrrClosed = pipelineSummary.reduce((sum, p) => sum + p.mrrClosed, 0)
  const mrrGap = REVENUE_TARGET_MONTHLY - totalMrrClosed
  const startDate = new Date(TARGET_START_DATE)
  const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, 90 - daysElapsed)

  // ── Build Slack message ───────────────────────────────────────────
  const isPct = (completed: number, target: number) =>
    target > 0 ? `${Math.round((completed / target) * 100)}%` : '—'

  const quotaLines = (quotas ?? [])
    .filter(q => q.agent_code !== 'PIPE-MGR')
    .map(q => {
      const icon = q.status === 'COMPLETE' ? '✅' : q.status === 'ON_TRACK' ? '🟡' : q.status === 'BEHIND' ? '🔴' : '⬜'
      return `${icon} *${q.agent_code}*: ${q.completed}/${q.target} (${isPct(q.completed, q.target)})`
    })
    .join('\n')

  const pipelineLines = pipelineSummary.map(p => {
    const s = p.stageCounts
    return [
      `*${p.arm.toUpperCase()}* — ${p.total} total | $${p.mrrClosed.toLocaleString()} closed`,
      `  QUEUED: ${s.QUEUED ?? 0} | OUTREACH: ${s.OUTREACH_SENT ?? 0} | FOLLOW_UPS: ${(s.FOLLOW_UP_1 ?? 0) + (s.FOLLOW_UP_2 ?? 0) + (s.FOLLOW_UP_3 ?? 0)}`,
      `  REPLIED: ${s.REPLIED ?? 0} | CALL_BOOKED: ${s.CALL_BOOKED ?? 0} | PROPOSED: ${s.PROPOSED ?? 0} | WON: ${s.CLOSED_WON ?? 0}`,
    ].join('\n')
  }).join('\n\n')

  const hotLeadLines = hotLeads.length
    ? hotLeads.slice(0, 5).map(l =>
        `• *${l.first_name ?? l.email}* (${l.company ?? l.arm}) — ${l.flag_reason ?? l.stage}`
      ).join('\n')
    : '_No hot leads right now._'

  const mrrBar = Math.round((totalMrrClosed / REVENUE_TARGET_MONTHLY) * 20)
  const mrrBarStr = '█'.repeat(mrrBar) + '░'.repeat(20 - mrrBar)

  const message = reportType === 'MORNING'
    ? `
*🌅 EMPIRE MORNING BRIEF — ${today}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*📊 MRR PROGRESS*
\`${mrrBarStr}\` $${totalMrrClosed.toLocaleString()} / $${REVENUE_TARGET_MONTHLY.toLocaleString()} target
Gap: $${mrrGap.toLocaleString()} | ${daysRemaining} days remaining in 90-day window

*📋 TODAY'S QUOTA*
${quotaLines || '_No quotas set_'}

*🔄 PIPELINE SNAPSHOT*
${pipelineLines}

*🔥 HOT LEADS — NEEDS YOUR ATTENTION*
${hotLeadLines}
`.trim()
    : `
*🌆 EMPIRE EVENING REPORT — ${today}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*📈 TODAY'S ACTIVITY*
Leads found: *${leadsFoundToday}* | Outreach sent: *${outreachSentToday}* | Follow-ups: *${followUpsSentToday}* | Stages advanced: *${stagesAdvancedToday}*

*📋 QUOTA COMPLETION*
${quotaLines || '_No quotas_'}

*💰 REVENUE STATUS*
\`${mrrBarStr}\` $${totalMrrClosed.toLocaleString()} / $${REVENUE_TARGET_MONTHLY.toLocaleString()}
${daysRemaining} days remaining | Gap: $${mrrGap.toLocaleString()}

*🔥 FLAGS FOR JERRY*
${hotLeadLines}

_Next run: tomorrow morning 7:30am_
`.trim()

  // ── Post to Slack ─────────────────────────────────────────────────
  const slackResult = await slackPostMessage({ channel: REPORT_CHANNEL, text: message })

  // ── Store report ──────────────────────────────────────────────────
  const payload = {
    report_type: reportType,
    mrr_closed: totalMrrClosed,
    mrr_gap: mrrGap,
    days_remaining: daysRemaining,
    leads_found_today: leadsFoundToday,
    outreach_sent_today: outreachSentToday,
    pipeline: pipelineSummary,
    quotas,
    hot_leads_count: hotLeads.length,
  }

  const { data: report } = await supabase
    .from('agent_reports')
    .insert({
      report_type: reportType,
      report_date: today,
      payload,
      slack_ts: slackResult.ts,
      delivered_to: slackResult.ok ? ['slack'] : [],
    })
    .select()
    .single()

  // Update REPORT-2X quota
  await supabase
    .from('agent_daily_quotas')
    .update({ last_run_at: now.toISOString(), updated_at: now.toISOString() })
    .eq('agent_code', 'REPORT-2X')
    .eq('date', today)

  return NextResponse.json({
    ok: true,
    report_type: reportType,
    slack_ok: slackResult.ok,
    slack_error: slackResult.error,
    report_id: report?.id,
    mrr_closed: totalMrrClosed,
    mrr_gap: mrrGap,
    hot_leads: hotLeads.length,
  })
}
