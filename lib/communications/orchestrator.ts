import { processInboundEvent } from './agents/reception'
import { intakeNewLead, qualifyLead, setPriority } from './agents/lead-intake'
import { handleCallbackNeeded, getDueCallbacks, getOverdueCallbacks } from './agents/callback'
import { handleMediaInquiry } from './agents/media'
import { handlePartnershipInquiry } from './agents/partnership'
import { closeWon, closeLost, getHotLeads, getSalesPipeline, getStaleLeads } from './agents/sales'
import { generateFounderBrief, deliverFounderBrief } from './agents/founder-briefing'
import { advanceStage } from './services/pipeline'
import { processVoiceCall } from './services/voice-call-processor'
import { alertSystem, alertFounder } from './integrations/slack'
import { getStore, resetStore } from './integrations/store'

export interface CommsOStatus {
  contacts: number
  leads: number
  interactions: number
  callbacks: number
  pipelineValue: number
  closedRevenue: number
  hotLeads: number
  staleLeads: number
}

export function getStatus(): CommsOStatus {
  const store = getStore()
  return {
    contacts: store.contacts.length,
    leads: store.leads.length,
    interactions: store.interactions.length,
    callbacks: store.callbacks.length,
    pipelineValue: store.opportunities.reduce((s, o) => s + o.estimated_value, 0),
    closedRevenue: store.opportunities.filter(o => o.stage === 'won').reduce((s, o) => s + o.estimated_value, 0),
    hotLeads: store.leads.filter(l => l.priority === 'high' && !['won', 'lost', 'dormant'].includes(l.pipeline_stage)).length,
    staleLeads: getStaleLeads(14).length,
  }
}

export {
  processInboundEvent,
  intakeNewLead,
  qualifyLead,
  setPriority,
  handleCallbackNeeded,
  getDueCallbacks,
  getOverdueCallbacks,
  handleMediaInquiry,
  handlePartnershipInquiry,
  closeWon,
  closeLost,
  getHotLeads,
  getSalesPipeline,
  getStaleLeads,
  generateFounderBrief,
  deliverFounderBrief,
  advanceStage,
  processVoiceCall,
  alertSystem,
  alertFounder,
  resetStore,
}
