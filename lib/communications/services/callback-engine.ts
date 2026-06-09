import type { Lead, Callback } from '../types'
import { CALLBACK_CADENCE } from '../config'
import { addCallback, updateCallback, getStore } from '../integrations/store'

const SCRIPT_TEMPLATES: Record<string, string> = {
  'jd-productions': 'Hi {name}, this is Jerry from JD Productions. I got your message about video/creative work. I\'d love to hear more about what you\'re working on. What\'s a good time to chat?',
  'bridge-video': 'Hi {name}, this is Jerry from Bridge Video. Thanks for reaching out about business video. Can you tell me a bit about your brand and what kind of video you\'re looking for?',
  'access': 'Hi {name}, this is Jerry from ACCESS. I saw your inquiry about AI systems and automation. I\'d love to understand your current setup and where you want to go. Free to talk this week?',
  'regal': 'Hi {name}, this is Jerry from REGAL. Thanks for your interest in our nonprofit work. Let me connect you with the right person on our team.',
  'general': 'Hi {name}, this is Jerry. Thanks for reaching out. I got your message and want to make sure we connect. What works best for you — a call or email?',
}

export function createCallback(lead: Lead): Callback {
  const scriptKey = lead.service_requested ?? 'general'
  const template = SCRIPT_TEMPLATES[scriptKey] ?? SCRIPT_TEMPLATES['general']
  const script = template.replace(/\{name\}/g, lead.name)
  const dueBy = new Date(Date.now() + (lead.priority === 'high' ? 4 : lead.priority === 'medium' ? 8 : 24) * 60 * 60 * 1000).toISOString()
  const nextFollowUp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const callback: Callback = {
    id: crypto.randomUUID?.() ?? `cb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    lead_id: lead.id,
    contact_id: lead.contact_id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    reason: `New lead: ${lead.service_requested ?? 'general inquiry'} from ${lead.source}`,
    department: lead.department,
    priority: lead.priority,
    revenue_potential: lead.estimated_value,
    suggested_script: script,
    recommended_action: lead.priority === 'high' ? 'Call back same day — high-value opportunity' : 'Call back within 24 hours',
    assigned_to: undefined,
    due_by: dueBy,
    status: 'pending',
    follow_up_count: 0,
    next_follow_up: nextFollowUp,
    created_at: new Date().toISOString(),
  }

  return addCallback(callback)
}

export function advanceFollowUp(callbackId: string): Callback | null {
  const store = getStore()
  const cb = store.callbacks.find(c => c.id === callbackId)
  if (!cb || cb.status !== 'pending') return null

  const nextIdx = cb.follow_up_count + 1
  if (nextIdx >= CALLBACK_CADENCE.length) {
    updateCallback(callbackId, { status: 'cancelled' })
    return null
  }

  const cadence = CALLBACK_CADENCE[nextIdx]
  const dueBy = new Date(Date.now() + cadence.day * 24 * 60 * 60 * 1000).toISOString()

  updateCallback(callbackId, {
    follow_up_count: nextIdx,
    due_by: dueBy,
    next_follow_up: dueBy,
    suggested_script: getFollowUpScript(nextIdx, cb.name),
  })

  return getStore().callbacks.find(c => c.id === callbackId) ?? null
}

function getFollowUpScript(followUpNum: number, name: string): string {
  switch (followUpNum) {
    case 1: return `Hi ${name}, just following up on my previous message. Would love to connect when you have a moment.`
    case 2: return `Hi ${name}, wanted to check in one more time. Happy to jump on a quick call if you're still interested.`
    case 3: return `Hi ${name}, last note from me on this. If timing isn't right, no worries — feel free to reach out whenever works.`
    default: return `Hi ${name}, just checking in. Let me know if you'd like to reconnect.`
  }
}
