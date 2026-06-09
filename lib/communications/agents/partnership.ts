import type { Lead } from '../types'
import { getStore, addLead, addPipelineEntry } from '../integrations/store'
import { alertNewLead } from '../integrations/slack'
import { scoreLead } from '../services/priority-scorer'

export interface PartnershipInquiry {
  name: string
  company: string
  phone: string
  email?: string
  type: 'vendor' | 'partner' | 'sponsor' | 'collaborator' | 'affiliate'
  description?: string
}

export function handlePartnershipInquiry(input: PartnershipInquiry): Lead {
  const scored = scoreLead({
    name: input.name,
    company: input.company,
    phone: input.phone,
    email: input.email,
    source: `partnership-${input.type}`,
    service_requested: 'access',
    department: 'partnerships',
    decision_maker_status: 'yes',
  })

  const lead = scored.lead
  lead.pipeline_stage = 'captured'
  lead.business_type = input.type
  addLead(lead)

  addPipelineEntry({
    lead_id: lead.id,
    stage: 'captured',
    entered_at: new Date().toISOString(),
    notes: `Partnership inquiry: ${input.type}${input.description ? ` — ${input.description}` : ''}`,
    changed_by: 'partnership-agent',
  })

  alertNewLead(lead)
  return lead
}

export function getPartnershipLeads(): Lead[] {
  return getStore().leads.filter(l => l.department === 'partnerships')
}
