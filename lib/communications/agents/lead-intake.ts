import type { Lead, ServiceLine } from '../types'
import { scoreLead, determineUrgency } from '../services/priority-scorer'
import { alertNewLead } from '../integrations/slack'
import { addLead, addPipelineEntry, getStore } from '../integrations/store'

export interface IntakeInput {
  name: string
  company?: string
  phone: string
  email?: string
  source: string
  service_requested?: ServiceLine
  business_type?: string
  budget_range?: string
  timeline?: string
  location?: string
  decision_maker_status?: 'yes' | 'no' | 'unknown'
  notes?: string
}

export function intakeNewLead(input: IntakeInput): { lead: Lead; score: number } {
  const scored = scoreLead({
    ...input,
    urgency: determineUrgency(input.timeline),
    pipeline_stage: 'new-inquiry',
  })

  const lead = scored.lead
  if (input.notes) lead.notes = input.notes

  addLead(lead)
  addPipelineEntry({
    lead_id: lead.id,
    stage: 'new-inquiry',
    entered_at: new Date().toISOString(),
    notes: `Manual intake from ${input.source}${input.notes ? `: ${input.notes}` : ''}`,
    changed_by: 'lead-intake-agent',
  })

  return { lead, score: scored.score }
}

export function qualifyLead(leadId: string, updates: Partial<Lead>): Lead | null {
  const lead = getStore().leads.find(l => l.id === leadId)
  if (!lead) return null

  Object.assign(lead, updates, {
    pipeline_stage: 'qualified',
    updated_at: new Date().toISOString(),
  })

  addPipelineEntry({
    lead_id: lead.id,
    stage: 'qualified',
    entered_at: new Date().toISOString(),
    notes: `Qualified with provided details`,
    changed_by: 'lead-intake-agent',
  })

  return lead
}

export function setPriority(leadId: string): Lead | null {
  const lead = getStore().leads.find(l => l.id === leadId)
  if (!lead) return null

  const rescored = scoreLead(lead)
  Object.assign(lead, rescored.lead, {
    pipeline_stage: 'priority-scored',
    updated_at: new Date().toISOString(),
  })

  addPipelineEntry({
    lead_id: lead.id,
    stage: 'priority-scored',
    entered_at: new Date().toISOString(),
    notes: `Scored ${rescored.score}/100 — ${rescored.lead.priority.toUpperCase()}`,
    changed_by: 'lead-intake-agent',
  })

  return lead
}
