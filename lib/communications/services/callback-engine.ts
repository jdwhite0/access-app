import type { Lead, Callback } from '../types'
import { CALLBACK_CADENCE } from '../config'
import { addCallback, updateCallback, getStore } from '../integrations/store'

// Discovery Coach principle: the call that opens the conversation wins or loses the deal.
// Use SPIN structure: Situation (brief) → Problem (surface it) → Implication (let them feel the cost) → Need-Payoff (they articulate the value).
// Customer Service principle: acknowledge first, never lead with the pitch.
const SCRIPT_TEMPLATES: Record<string, string> = {
  'jd-productions': 'Hi {name}, this is Jerry from JD Productions — thanks for reaching out. I want to make sure I understand exactly what you\'re working on before anything else. Walk me through where you are right now — what\'s the project, and what\'s the biggest thing that\'s not working the way you want it to?',
  'bridge-video': 'Hi {name}, Jerry from Bridge Video. Got your message — appreciate you reaching out. Quick question before we jump in: what does your current video presence look like, and where do you feel like it\'s costing you the most — awareness, conversions, or something else?',
  'access': 'Hi {name}, Jerry from ACCESS. Thanks for the inquiry. I\'d love to understand your setup first — what are you currently using to manage your operations or AI tools, and where does it break down for you?',
  'kingdom-consulting': 'Hi {name}, this is Jerry. Thanks for reaching out to Kingdom Consulting. Before I tell you anything about what we do, I want to hear about you — what\'s the creative or brand challenge that actually brought you here today?',
  'wholesale-payments': 'Hi {name}, Jerry White here with Wholesale Payments. I got your message. Real quick — do you know off the top of your head what you paid in processing fees last month? I ask because I want to show you the actual math before we talk about anything else.',
  'regal': 'Hi {name}, this is Jerry. Thanks for your interest in our work. Tell me a bit about what brought you to REGAL — what\'s the situation you\'re in and what kind of support are you looking for?',
  'general': 'Hi {name}, this is Jerry. Got your message and I\'m glad you reached out. I want to make sure we\'re actually the right fit for you before anything — what\'s going on, and what made you decide to reach out today?',
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

// Discovery Coach follow-up principle: each follow-up adds NEW value — an implication question,
// a number, or a reframe. "Just checking in" is deleted. Persistence is professional; repetition is not.
function getFollowUpScript(followUpNum: number, name: string): string {
  switch (followUpNum) {
    case 1:
      return `Hi ${name}, following up from my last message. One question I forgot to ask — what happens if this doesn't get resolved in the next 30 days? I want to make sure I understand the stakes before we talk.`
    case 2:
      return `Hi ${name}, Jerry again. I don't want to be a broken record, so I'll ask directly — is the timing off, or is it something else? Either way I can work with that. Just want to know if it makes sense to keep the door open.`
    case 3:
      return `Hi ${name}, last one from me. If now isn't the right time, completely understand — feel free to reach back out whenever it makes sense. The opportunity will still be here.`
    default:
      return `Hi ${name}, just making sure you have my info. Reach out any time when you're ready.`
  }
}
