import type { Lead, Interaction } from '../types'
import { getStore, addInteraction } from '../integrations/store'
import { alertPipelineUpdate } from '../integrations/slack'
import { advanceStage } from '../services/pipeline'

export function assignToDepartment(leadId: string, department: string): Lead | null {
  const lead = getStore().leads.find(l => l.id === leadId)
  if (!lead) return null
  lead.department = department as any
  return lead
}

export function logOperationNote(leadId: string, note: string, createdBy: string = 'operations-agent'): Interaction | null {
  const lead = getStore().leads.find(l => l.id === leadId)
  if (!lead) return null

  const interaction: Interaction = {
    id: crypto.randomUUID?.() ?? `int-${Date.now()}`,
    contact_id: lead.contact_id,
    lead_id: lead.id,
    type: 'note',
    direction: 'inbound',
    summary: note,
    created_at: new Date().toISOString(),
  }

  addInteraction(interaction)
  return interaction
}

export function scheduleDiscovery(leadId: string, scheduledDate: string): Lead | null {
  const advanced = advanceStage(
    getStore().leads.find(l => l.id === leadId)!,
    'discovery-scheduled',
    'operations-agent'
  )
  if (advanced) {
    logOperationNote(leadId, `Discovery call scheduled for ${scheduledDate}`)
  }
  return advanced
}

export function flagForFulfillment(leadId: string): Lead | null {
  return assignToDepartment(leadId, 'operations')
}
