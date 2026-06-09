import type { QuoWebhookPayload, Contact, Interaction, CallIntent, Lead, Department } from '../types'
import { parseQuoWebhook, identifyDepartment, classifyCallIntent } from '../integrations/quo'
import { alertNewLead, alertSystem } from '../integrations/slack'
import { getContactByPhone, addContact, addInteraction, getStore, addLead, addPipelineEntry } from '../integrations/store'
import { scoreLead } from '../services/priority-scorer'
import { createCallback } from '../services/callback-engine'

export async function processInboundEvent(rawBody: Record<string, unknown>): Promise<{
  handled: boolean
  contact?: Contact
  lead?: Lead
  summary: string
}> {
  const payload = parseQuoWebhook(rawBody)
  if (!payload) return { handled: false, summary: 'Invalid webhook payload' }

  // 1. Find or create contact
  let contact = getContactByPhone(payload.from_number)
  const now = new Date().toISOString()

  if (!contact) {
    contact = addContact({
      id: crypto.randomUUID?.() ?? `cont-${Date.now()}`,
      name: payload.contact_name ?? 'Unknown Caller',
      phone: payload.from_number,
      source: `phone:${payload.to_number}`,
      tags: [],
      notes: '',
      first_contacted_at: now,
      last_contacted_at: now,
      total_interactions: 0,
    })
  }

  // 2. Create interaction record
  const interaction: Interaction = {
    id: crypto.randomUUID?.() ?? `int-${Date.now()}`,
    contact_id: contact.id,
    type: payload.event_type === 'new-text' ? 'text' : payload.event_type === 'new-voicemail' ? 'voicemail' : 'call',
    direction: 'inbound',
    summary: payload.sona_summary ?? payload.text_body ?? `${payload.event_type} from ${payload.from_number}`,
    duration_seconds: payload.duration_seconds,
    transcript: payload.call_transcript ?? payload.voicemail_transcript,
    recording_url: payload.voicemail_url,
    created_at: now,
  }
  addInteraction(interaction)

  // 3. Update contact
  contact.total_interactions++
  contact.last_contacted_at = now
  if (payload.contact_name && contact.name === 'Unknown Caller') {
    contact.name = payload.contact_name
  }

  // 4. Classify intent
  const contextText = [payload.sona_summary, payload.text_body, payload.voicemail_transcript, payload.call_transcript].filter(Boolean).join(' ')
  const intent = classifyCallIntent(contextText, payload.contact_name)
  const { department: dept } = identifyDepartment(payload.from_number, payload.to_number)

  // 5. Create lead if new inquiry
  let lead: Lead | undefined
  if (['new-client', 'media-inquiry', 'vendor-partner'].includes(intent)) {
    const existingLeads = getStore().leads.filter(l => l.contact_id === contact!.id && !['won', 'lost', 'dormant'].includes(l.pipeline_stage))
    if (existingLeads.length === 0) {
      const sourceLabel = payload.sona_summary ? 'sona-summary' : payload.event_type
      const scored = scoreLead({
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        contact_id: contact.id,
        source: sourceLabel,
        department: dept as Department ?? 'hq',
        pipeline_stage: 'captured',
        urgency: 'immediate',
      })
      lead = scored.lead

      // Override intent-based fields
      if (intent === 'media-inquiry') {
        lead.service_requested = 'jd-productions'
        lead.department = 'media'
        lead.source = 'media-inquiry'
      }
      if (intent === 'vendor-partner') {
        lead.department = 'partnerships'
        lead.source = 'partnership-inquiry'
      }

      addContact(contact)
      addLead(lead)
      addPipelineEntry({
        lead_id: lead.id,
        stage: 'captured',
        entered_at: now,
        notes: `Captured via ${sourceLabel}`,
        changed_by: 'reception-agent',
      })

      // 6. Create callback
      createCallback(lead)

      // 7. Alert Slack
      await alertNewLead(lead)
    } else {
      lead = existingLeads[0]
    }
  }

  if (payload.event_type === 'missed-call') {
    await alertSystem(`Missed call from ${contact.name} (${payload.from_number}) — ${intent}`)
  }

  return {
    handled: true,
    contact,
    lead,
    summary: `${intent} ${payload.event_type} from ${contact.name} — ${contact.phone}`,
  }
}
