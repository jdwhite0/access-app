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

export function getHotLeads(): Lead[] {
  return getStore().leads.filter(l =>
    l.pipeline_stage !== 'won' && l.pipeline_stage !== 'lost' && l.pipeline_stage !== 'dormant' && l.priority === 'high'
  )
}

export function getStaleLeads(daysThreshold: number = 14): Lead[] {
  const cutoff = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000)
  return getStore().leads.filter(l => {
    if (['won', 'lost', 'dormant'].includes(l.pipeline_stage)) return false
    return new Date(l.updated_at) < cutoff
  })
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
