import type { Lead, Interaction } from '../types'
import { getStore, addLead, addPipelineEntry } from '../integrations/store'
import { alertNewLead } from '../integrations/slack'
import { scoreLead } from '../services/priority-scorer'

export interface MediaInquiry {
  name: string
  company?: string
  phone: string
  email?: string
  outlet?: string
  type: 'interview' | 'podcast' | 'press' | 'speaking' | 'other'
  topic?: string
  deadline?: string
}

export function handleMediaInquiry(input: MediaInquiry): Lead {
  const scored = scoreLead({
    name: input.name,
    company: input.company ?? input.outlet,
    phone: input.phone,
    email: input.email,
    source: `media-${input.type}`,
    service_requested: 'jd-productions',
    department: 'media',
    timeline: input.deadline,
    decision_maker_status: 'yes',
  })

  const lead = scored.lead
  lead.pipeline_stage = 'captured'
  addLead(lead)

  addPipelineEntry({
    lead_id: lead.id,
    stage: 'captured',
    entered_at: new Date().toISOString(),
    notes: `Media inquiry: ${input.type}${input.topic ? ` — Topic: ${input.topic}` : ''}${input.outlet ? ` — Outlet: ${input.outlet}` : ''}`,
    changed_by: 'media-agent',
  })

  alertNewLead(lead)
  return lead
}
