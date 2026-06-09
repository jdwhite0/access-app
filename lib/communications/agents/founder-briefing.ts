import type { Lead, Callback } from '../types'
import { getStore } from '../integrations/store'
import { alertFounder } from '../integrations/slack'
import { getPipelineValue, getClosedRevenue } from '../integrations/store'
import { getOverdueCallbacks } from '../agents/callback'
import { getHotLeads, getStaleLeads, getSalesPipeline } from '../agents/sales'

export interface FounderBrief {
  date: string
  newLeadsToday: number
  highPriorityLeads: Lead[]
  missedCalls: number
  callbacksDue: Callback[]
  proposalsNeeded: number
  followUpsDue: number
  pipelineValue: { total: number; weighted: number }
  closedRevenue: number
  stalledLeads: Lead[]
  topActions: string[]
}

export function generateFounderBrief(): FounderBrief {
  const allLeads = getStore().leads
  const newToday = allLeads.filter(l => l.created_at.startsWith(new Date().toISOString().split('T')[0]))
  const hot = getHotLeads()
  const overdue = getOverdueCallbacks()
  const stalled = getStaleLeads(14)
  const pipeline = getSalesPipeline()
  const pv = getPipelineValue()
  const closed = getClosedRevenue()
  const proposalsNeeded = pipeline.find(p => p.stage === 'proposal-needed')?.count ?? 0
  const followUpsDue = pipeline.find(p => p.stage === 'follow-up-due')?.count ?? 0
  const missedCalls = getStore().interactions.filter(i => i.type === 'call' && i.direction === 'inbound' && !i.summary).length

  const topActions: string[] = []
  if (hot.length > 0) topActions.push(`Call ${hot[0].name} — high-priority lead ($${hot[0].estimated_value.toLocaleString()})`)
  if (overdue.length > 0) topActions.push(`Follow up on ${overdue.length} overdue callbacks`)
  if (proposalsNeeded > 0) topActions.push(`Send ${proposalsNeeded} proposals waiting`)
  if (stalled.length > 0) topActions.push(`Review ${stalled.length} stalled leads — move or recycle`)
  if (topActions.length === 0) topActions.push('Pipeline is current — focus on outreach')

  return {
    date: new Date().toISOString(),
    newLeadsToday: newToday.length,
    highPriorityLeads: hot,
    missedCalls,
    callbacksDue: overdue,
    proposalsNeeded,
    followUpsDue,
    pipelineValue: pv,
    closedRevenue: closed,
    stalledLeads: stalled,
    topActions,
  }
}

export async function deliverFounderBrief(): Promise<void> {
  const brief = generateFounderBrief()
  const text = [
    `*📋 Founder Daily Brief — ${brief.date.split('T')[0]}*`,
    ``,
    `*New leads today:* ${brief.newLeadsToday}`,
    `*High-priority:* ${brief.highPriorityLeads.length}`,
    `*Missed calls:* ${brief.missedCalls}`,
    `*Callbacks overdue:* ${brief.callbacksDue.length}`,
    `*Proposals needed:* ${brief.proposalsNeeded}`,
    `*Follow-ups due:* ${brief.followUpsDue}`,
    `*Stalled leads:* ${brief.stalledLeads.length}`,
    ``,
    `*Pipeline value:* $${brief.pipelineValue.total.toLocaleString()}`,
    `*Weighted:* $${brief.pipelineValue.weighted.toLocaleString()}`,
    `*Closed:* $${brief.closedRevenue.toLocaleString()}`,
    ``,
    `*🎯 Top 3 Actions*`,
    brief.topActions.map((a, i) => `${i + 1}. ${a}`).join('\n'),
  ].join('\n')

  await alertFounder(text)
}
