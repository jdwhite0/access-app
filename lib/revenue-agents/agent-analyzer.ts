import { createClient } from '@supabase/supabase-js'
import type { Arm, AgentCode, PipelineLead, PipelineStage } from './types'
import { REVENUE_TARGET_MONTHLY } from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface AgentMetrics {
  agent: AgentCode
  arm: Arm
  yesterday: {
    discovered: number
    submitted: number
    outreach_sent: number
    replies: number
    calls_booked: number
  }
  weekly: {
    discovered: number
    submitted: number
    outreach_sent: number
    replies: number
    calls_booked: number
    deals_won: number
    revenue_closed: number
  }
  conversion_rates: {
    submit_to_outreach: number
    outreach_to_reply: number
    reply_to_call: number
    call_to_close: number
    overall_lead_to_close: number
  }
  performance_score: number
  trend: 'improving' | 'declining' | 'stable'
}

export interface PipelineValue {
  by_arm: Record<Arm, {
    total_leads: number
    total_value: number
    weighted_value: number
  }>
  total_leads: number
  total_value: number
  weighted_value: number
  gap_to_target: number
  projected_mrr: number
}

export interface Bottleneck {
  arm: Arm
  stage: PipelineStage
  leads_in_stage: number
  leads_stuck: number
  avg_days_in_stage: number
  severity: 'critical' | 'warning' | 'normal'
  recommendation: string
}

export interface PerformanceReport {
  pipeline_value: PipelineValue
  agent_metrics: AgentMetrics[]
  bottlenecks: Bottleneck[]
  revenue_projection: {
    current_mrr: number
    target_mrr: number
    gap: number
    projected_closed_this_month: number
    days_remaining_in_month: number
  }
  summary: string
}

const STAGE_WEIGHTS: Record<PipelineStage, number> = {
  IDENTIFIED: 0.02,
  SCORED: 0.05,
  QUEUED: 0.08,
  OUTREACH_SENT: 0.1,
  FOLLOW_UP_1: 0.12,
  FOLLOW_UP_2: 0.15,
  FOLLOW_UP_3: 0.18,
  REPLIED: 0.25,
  CALL_BOOKED: 0.4,
  PROPOSED: 0.6,
  CLOSED_WON: 1.0,
  CLOSED_LOST: 0,
  NURTURE_30: 0.05,
}

function getDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function getDateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

async function getPipelineByArm(arm: Arm): Promise<PipelineLead[]> {
  const { data } = await supabase
    .from('pipeline_leads')
    .select('*')
    .eq('arm', arm)
    .not('stage', 'eq', 'CLOSED_LOST')
    .order('created_at', { ascending: false })
  return (data ?? []) as PipelineLead[]
}

async function getActivityForAgent(agent: AgentCode, since: string): Promise<{ action: string; lead_id?: string }[]> {
  const { data } = await supabase
    .from('agent_activity_logs')
    .select('action, lead_id')
    .eq('agent_code', agent)
    .gte('created_at', since)
  return (data ?? [])
}

async function getClosedValue(arm: Arm, since: string): Promise<number> {
  const { data } = await supabase
    .from('pipeline_leads')
    .select('closed_value')
    .eq('arm', arm)
    .eq('stage', 'CLOSED_WON')
    .gte('closed_at', since)
  return (data ?? []).reduce((sum: number, l: { closed_value?: number | null }) => sum + (l.closed_value ?? 0), 0)
}

export async function calculateAgentMetrics(agent: AgentCode): Promise<AgentMetrics> {
  const armMap: Record<AgentCode, Arm> = {
    'SCOUT-CON': 'consulting', 'SCOUT-BV': 'bridge-video', 'SCOUT-WP': 'wholesale-payments',
    'REACH-CON': 'consulting', 'REACH-BV': 'bridge-video', 'REACH-WP': 'wholesale-payments',
    'PUB-ACCESS': 'consulting', 'PIPE-MGR': 'consulting', 'REPORT-2X': 'consulting',
  }
  const arm = armMap[agent]

  const yesterday_actions = await getActivityForAgent(agent, getDaysAgo(1))
  const weekly_actions = await getActivityForAgent(agent, getDaysAgo(7))

  const countAction = (actions: { action: string }[], actionType: string): number =>
    actions.filter(a => a.action === actionType).length

  const yesterday = {
    discovered: countAction(yesterday_actions, 'BATCH_SCOUT'),
    submitted: yesterday_actions.filter(a => a.action === 'BATCH_SCOUT').length,
    outreach_sent: countAction(yesterday_actions, 'BATCH_OUTREACH'),
    replies: countAction(yesterday_actions, 'REPLY_RECEIVED'),
    calls_booked: countAction(yesterday_actions, 'CALL_BOOKED'),
  }

  const weekly = {
    discovered: countAction(weekly_actions, 'BATCH_SCOUT'),
    submitted: weekly_actions.filter(a => a.action === 'BATCH_SCOUT').length,
    outreach_sent: countAction(weekly_actions, 'BATCH_OUTREACH'),
    replies: countAction(weekly_actions, 'REPLY_RECEIVED'),
    calls_booked: countAction(weekly_actions, 'CALL_BOOKED'),
    deals_won: countAction(weekly_actions, 'DEAL_CLOSED'),
    revenue_closed: await getClosedValue(arm, getDaysAgo(7)),
  }

  const sr = weekly.submitted || 1
  const or = weekly.outreach_sent || 1
  const rr = weekly.replies || 1
  const cr = weekly.calls_booked || 1

  const conversion_rates = {
    submit_to_outreach: Math.round((weekly.outreach_sent / sr) * 100),
    outreach_to_reply: Math.round((weekly.replies / or) * 100),
    reply_to_call: Math.round((weekly.calls_booked / rr) * 100),
    call_to_close: Math.round((weekly.deals_won / cr) * 100),
    overall_lead_to_close: Math.round((weekly.deals_won / sr) * 100),
  }

  const score = Math.round(
    (conversion_rates.outreach_to_reply * 0.3) +
    (conversion_rates.reply_to_call * 0.3) +
    (conversion_rates.submit_to_outreach * 0.2) +
    (weekly.outreach_sent * 2) -
    (weekly.deals_won > 0 ? 0 : 5)
  )

  const trend: AgentMetrics['trend'] =
    score > 60 ? 'improving' :
    score < 30 ? 'declining' : 'stable'

  return {
    agent, arm,
    yesterday, weekly, conversion_rates,
    performance_score: Math.max(0, Math.min(100, score)),
    trend,
  }
}

export async function calculatePipelineValue(): Promise<PipelineValue> {
  const arms: Arm[] = ['consulting', 'bridge-video', 'wholesale-payments']
  let total_all = 0
  let weighted_all = 0
  let all_leads = 0

  const by_arm = {} as Record<Arm, { total_leads: number; total_value: number; weighted_value: number }>

  for (const arm of arms) {
    const leads = await getPipelineByArm(arm)
    let total = 0
    let weighted = 0

    for (const lead of leads) {
      const val = (lead.raw_data as Record<string, unknown>)?.estimated_value as number ?? 5000
      if (lead.stage === 'CLOSED_WON') {
        total += lead.closed_value ?? val
        weighted += lead.closed_value ?? val
      } else {
        total += val
        weighted += val * (STAGE_WEIGHTS[lead.stage] ?? 0.05)
      }
    }

    by_arm[arm] = { total_leads: leads.length, total_value: total, weighted_value: Math.round(weighted) }
    all_leads += leads.length
    total_all += total
    weighted_all += weighted
  }

  const total_weighted = Math.round(weighted_all)
  const gap = Math.max(0, REVENUE_TARGET_MONTHLY - total_weighted)

  return {
    by_arm,
    total_leads: all_leads,
    total_value: Math.round(total_all),
    weighted_value: total_weighted,
    gap_to_target: gap,
    projected_mrr: total_weighted,
  }
}

export async function detectBottlenecks(): Promise<Bottleneck[]> {
  const arms: Arm[] = ['consulting', 'bridge-video', 'wholesale-payments']
  const bottlenecks: Bottleneck[] = []

  for (const arm of arms) {
    const leads = await getPipelineByArm(arm)

    const stageCounts: Record<string, { count: number; oldest: Date }> = {}
    for (const lead of leads) {
      if (!stageCounts[lead.stage]) stageCounts[lead.stage] = { count: 0, oldest: new Date() }
      stageCounts[lead.stage].count++
      const updated = new Date(lead.updated_at)
      if (updated < stageCounts[lead.stage].oldest) stageCounts[lead.stage].oldest = updated
    }

    for (const [stage, info] of Object.entries(stageCounts)) {
      const daysInStage = Math.round((Date.now() - info.oldest.getTime()) / 86400000)
      const followUpStages = ['OUTREACH_SENT', 'FOLLOW_UP_1', 'FOLLOW_UP_2']
      const isStuck = followUpStages.includes(stage) && daysInStage > 7

      if (isStuck && info.count >= 3) {
        bottlenecks.push({
          arm,
          stage: stage as PipelineStage,
          leads_in_stage: info.count,
          leads_stuck: info.count,
          avg_days_in_stage: daysInStage,
          severity: daysInStage > 14 ? 'critical' : 'warning',
          recommendation: daysInStage > 14
            ? `Review ${arm} outreach copy — ${info.count} leads stuck in ${stage} for ${daysInStage} days. Consider rotating email templates or ICP targeting.`
            : `${info.count} leads in ${stage} for ${daysInStage} days without reply. Flag for manual review.`,
        })
      }
    }
  }

  return bottlenecks
}

export async function generatePerformanceReport(): Promise<PerformanceReport> {
  const agents: AgentCode[] = ['SCOUT-CON', 'SCOUT-BV', 'SCOUT-WP', 'REACH-CON', 'REACH-BV', 'REACH-WP']
  const [agent_metrics, pipeline_value, bottlenecks] = await Promise.all([
    Promise.all(agents.map(calculateAgentMetrics)),
    calculatePipelineValue(),
    detectBottlenecks(),
  ])

  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const daysLeft = Math.max(1, Math.round((endOfMonth.getTime() - now.getTime()) / 86400000))

  const projected_closed = Math.round(pipeline_value.weighted_value * 0.3)
  const current_mrr = pipeline_value.by_arm.consulting.total_value > 0 ? Math.round(pipeline_value.weighted_value * 0.15) : 0
  const gap = Math.max(0, REVENUE_TARGET_MONTHLY - current_mrr)

  const bestAgent = agent_metrics.reduce((best, a) => a.performance_score > (best?.performance_score ?? 0) ? a : best, agent_metrics[0])
  const worstAgent = agent_metrics.reduce((worst, a) => a.performance_score < (worst?.performance_score ?? 100) ? a : worst, agent_metrics[0])

  const summary = [
    `Pipeline Value: $${pipeline_value.weighted_value.toLocaleString()} (weighted)`,
    `Monthly Target: $${REVENUE_TARGET_MONTHLY.toLocaleString()}`,
    `Gap: $${gap.toLocaleString()}`,
    `${daysLeft} days remaining this month`,
    `Top Agent: ${bestAgent?.agent ?? 'N/A'} (${bestAgent?.performance_score ?? 0}/100)`,
    `Needs Attention: ${worstAgent?.agent ?? 'N/A'} (${worstAgent?.performance_score ?? 0}/100)`,
    bottlenecks.length > 0 ? `${bottlenecks.length} bottleneck(s) detected` : 'No bottlenecks detected',
  ].join(' | ')

  return {
    pipeline_value,
    agent_metrics,
    bottlenecks,
    revenue_projection: {
      current_mrr,
      target_mrr: REVENUE_TARGET_MONTHLY,
      gap,
      projected_closed_this_month: projected_closed,
      days_remaining_in_month: daysLeft,
    },
    summary,
  }
}
