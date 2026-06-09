import type { Lead } from '../types'
import { getStore } from '../integrations/store'
import { advanceStage } from '../services/pipeline'
import { alertPipelineUpdate, alertFounder, alertRevenueDashboard } from '../integrations/slack'
import { getPipelineValue, getClosedRevenue } from '../integrations/store'

export function moveToProposal(leadId: string): Lead | null {
  return advanceStage(getStore().leads.find(l => l.id === leadId)!, 'proposal-needed', 'sales-agent')
}

export function markProposalSent(leadId: string): Lead | null {
  return advanceStage(getStore().leads.find(l => l.id === leadId)!, 'proposal-sent', 'sales-agent')
}

export function markFollowUpDue(leadId: string): Lead | null {
  return advanceStage(getStore().leads.find(l => l.id === leadId)!, 'follow-up-due', 'sales-agent')
}

export function closeWon(leadId: string, value?: number): Lead | null {
  const lead = getStore().leads.find(l => l.id === leadId)
  if (!lead) return null
  if (value) lead.estimated_value = value
  const result = advanceStage(lead, 'won', 'sales-agent')
  if (result) {
    updateRevenueDashboard()
  }
  return result
}

export function closeLost(leadId: string, reason?: string): Lead | null {
  const result = advanceStage(getStore().leads.find(l => l.id === leadId)!, 'lost', 'sales-agent')
  return result
}

// Outbound Strategist principle: speed-to-signal is the critical metric.
// The half-life of a buying signal is short. Hot leads contacted within 30 min convert at 4-8x.
export function getHotLeads(): Lead[] {
  return getStore().leads.filter(l =>
    l.pipeline_stage !== 'won' && l.pipeline_stage !== 'lost' && l.pipeline_stage !== 'dormant' && l.priority === 'high'
  )
}

// Pipeline Analyst principle: stale deals don't close — they just occupy pipeline space and inflate forecasts.
// Flag anything stuck in the same stage past the threshold. Stage age predicts outcomes better than stage alone.
export function getStaleLeads(daysThreshold: number = 14): Lead[] {
  const cutoff = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000)
  return getStore().leads.filter(l => {
    if (['won', 'lost', 'dormant'].includes(l.pipeline_stage)) return false
    return new Date(l.updated_at) < cutoff
  })
}

// Pipeline Analyst: deal health score — combines qualification depth, stage age, and risk signals.
// Returns 0-100. Below 40 = at risk. Below 20 = effectively dead.
export function getDealHealthScore(lead: Lead): { score: number; flags: string[] } {
  const flags: string[] = []
  let score = 50

  // Qualification depth (MEDDPICC-inspired)
  if (lead.budget_range) score += 10
  else flags.push('No budget captured')

  if (lead.decision_maker_status === 'yes') score += 10
  else if (lead.decision_maker_status === 'no') { score -= 15; flags.push('Not decision maker') }
  else flags.push('Decision maker unknown')

  if (lead.timeline) score += 10
  else flags.push('No timeline established')

  // Urgency signal
  if (lead.urgency === 'immediate') score += 10
  else if (lead.urgency === 'unknown') { score -= 10; flags.push('Urgency unknown') }

  // Stage age — deals sitting still are dying
  const daysSinceUpdate = (Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSinceUpdate > 14) { score -= 20; flags.push(`Stale: ${Math.round(daysSinceUpdate)} days in stage`) }
  else if (daysSinceUpdate > 7) { score -= 10; flags.push(`${Math.round(daysSinceUpdate)} days without update`) }

  // Source quality
  if (lead.source?.includes('referral')) score += 10
  if (lead.source?.includes('inbound') || lead.source?.includes('phone')) score += 5

  return { score: Math.max(0, Math.min(100, score)), flags }
}

export function getSalesPipeline(): { stage: string; count: number; value: number }[] {
  const stages = ['new-inquiry', 'captured', 'qualified', 'priority-scored', 'callback-needed', 'discovery-scheduled', 'proposal-needed', 'proposal-sent', 'follow-up-due']
  return stages.map(stage => {
    const leads = getStore().leads.filter(l => l.pipeline_stage === stage)
    return { stage, count: leads.length, value: leads.reduce((s, l) => s + l.estimated_value, 0) }
  })
}

async function updateRevenueDashboard(): Promise<void> {
  const pv = getPipelineValue()
  const closed = getClosedRevenue()
  await alertRevenueDashboard(
    `*Revenue Update*\nPipeline: $${pv.total.toLocaleString()} (weighted: $${pv.weighted.toLocaleString()})\nClosed: $${closed.toLocaleString()}`
  )
}
