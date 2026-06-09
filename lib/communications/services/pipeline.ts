import type { Lead, PipelineEntry, PipelineStage } from '../types'
import { PIPELINE_STAGES } from '../config'
import { addPipelineEntry, getLeadPipeline, updateLead, addOpportunity } from '../integrations/store'

export function advanceStage(lead: Lead, newStage: PipelineStage, changedBy: string = 'system'): Lead | null {
  const currentIdx = PIPELINE_STAGES.indexOf(lead.pipeline_stage)
  const newIdx = PIPELINE_STAGES.indexOf(newStage)

  if (newIdx < currentIdx) return null

  const entry: PipelineEntry = {
    lead_id: lead.id,
    stage: newStage,
    entered_at: new Date().toISOString(),
    notes: `Advanced from ${lead.pipeline_stage} → ${newStage}`,
    changed_by: changedBy,
  }

  addPipelineEntry(entry)
  const updated = updateLead(lead.id, { pipeline_stage: newStage })

  if (newStage === 'won') {
    addOpportunity({
      id: crypto.randomUUID?.() ?? `opp-${Date.now()}`,
      lead_id: lead.id,
      name: lead.name,
      company: lead.company,
      service_line: lead.service_requested ?? 'access',
      estimated_value: lead.estimated_value,
      probability: 1,
      stage: 'won',
      expected_close: new Date().toISOString(),
      notes: 'Closed won',
    })
  }

  if (newStage === 'lost') {
    addOpportunity({
      id: crypto.randomUUID?.() ?? `opp-${Date.now()}`,
      lead_id: lead.id,
      name: lead.name,
      company: lead.company,
      service_line: lead.service_requested ?? 'access',
      estimated_value: 0,
      probability: 0,
      stage: 'lost',
      expected_close: '',
      notes: 'Lost',
    })
  }

  return updated ?? null
}

export function getStageHistory(leadId: string): PipelineEntry[] {
  return getLeadPipeline(leadId)
}

export function getNextRecommendedStage(currentStage: PipelineStage): PipelineStage | null {
  const idx = PIPELINE_STAGES.indexOf(currentStage)
  if (idx < 0 || idx >= PIPELINE_STAGES.length - 1) return null
  return PIPELINE_STAGES[idx + 1]
}

export function getStalledLeads(leads: Lead[], daysInStage: number = 7): Lead[] {
  const cutoff = new Date(Date.now() - daysInStage * 24 * 60 * 60 * 1000).toISOString()
  return leads.filter(l => {
    if (['won', 'lost', 'dormant'].includes(l.pipeline_stage)) return false
    return l.updated_at < cutoff
  })
}
