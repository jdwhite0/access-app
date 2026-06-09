import type { QuoWebhookPayload, Contact, Interaction, CallIntent } from '../types'
import { DEPARTMENT_ROUTING, PHONE_MAP } from '../config'

export function parseQuoWebhook(body: Record<string, unknown>): QuoWebhookPayload | null {
  const eventType = body.event_type as string ?? body.type as string ?? ''
  const normalized: QuoWebhookPayload = {
    event_type: normalizeEventType(eventType),
    call_id: (body.call_id ?? body.id ?? '') as string,
    from_number: cleanNumber((body.from ?? body.from_number ?? body.caller ?? '') as string),
    to_number: cleanNumber((body.to ?? body.to_number ?? body.phone ?? '') as string),
    direction: (body.direction as 'inbound' | 'outbound') ?? 'inbound',
    duration_seconds: Number(body.duration_seconds ?? body.duration ?? 0) || undefined,
    voicemail_url: (body.voicemail_url ?? body.recording_url ?? '') as string || undefined,
    voicemail_transcript: (body.voicemail_transcript ?? body.transcript ?? '') as string || undefined,
    text_body: (body.text_body ?? body.message ?? body.body ?? '') as string || undefined,
    sona_summary: (body.sona_summary ?? body.summary ?? '') as string || undefined,
    contact_name: (body.contact_name ?? body.name ?? '') as string || undefined,
    contact_id: (body.contact_id ?? '') as string || undefined,
    call_transcript: (body.call_transcript ?? body.transcript ?? '') as string || undefined,
    timestamp: (body.timestamp ?? body.created_at ?? new Date().toISOString()) as string,
  }
  if (!normalized.from_number && !normalized.to_number) return null
  return normalized
}

function normalizeEventType(raw: string): QuoWebhookPayload['event_type'] {
  const map: Record<string, QuoWebhookPayload['event_type']> = {
    'new_call': 'new-call',
    'missed_call': 'missed-call',
    'new_text': 'new-text',
    'new_voicemail': 'new-voicemail',
    'sona_summary': 'sona-summary',
    'call_transcript': 'call-transcript',
    'new_contact': 'new-contact',
    'updated_contact': 'updated-contact',
  }
  return map[raw] ?? 'new-call'
}

export function cleanNumber(raw: string): string {
  return raw.replace(/[^\d+]/g, '').replace(/^1(\d{10})$/, '+1$1')
}

export function identifyDepartment(fromNumber: string, toNumber: string): { department: string; intent: CallIntent | null } {
  const toClean = cleanNumber(toNumber)
  const is678 = toClean.startsWith('+1678')
  const is407 = toClean.startsWith('+1407')
  const is813 = toClean.startsWith('+1813')

  if (is813 || is678) return { department: 'hq', intent: null }
  if (is407) return { department: 'operations', intent: null }
  return { department: 'hq', intent: null }
}

// Customer Service principle: assume positive intent, treat every unknown as a potential new client.
// Founder-office ranked first — those calls are never missed regardless of other signals.
export function classifyCallIntent(text: string, contactName?: string): CallIntent {
  const lower = text.toLowerCase()

  // Founder direct — highest priority, route immediately
  if (/\b(founder|jerry|owner|ceo|executive|leadership|personal)\b/.test(lower) || contactName?.toLowerCase().includes('jerry')) return 'founder-office'

  // Media — press, podcast, speaking, coverage
  if (/\b(media|press|interview|podcast|speaking|news|reporter|feature|story|coverage|pr)\b/.test(lower)) return 'media-inquiry'

  // Vendor / partner — B2B relationships, not service clients
  if (/\b(vendor|partner|partnership|sponsor|collaborate|affiliate|wholesale|distribution|resell)\b/.test(lower)) return 'vendor-partner'

  // Existing client — they reference prior work or account context
  if (/\b(existing|current|returning|already|previous|my account|invoice|project update|follow.?up|still working)\b/.test(lower)) return 'existing-client'

  // New client buying signals — any intent, budget curiosity, or service need
  if (/\b(new|help|interested|services|quote|estimate|pricing|sign.?up|start|hire|book|schedule|cost|how much|available|looking for|need|want|information)\b/.test(lower)) return 'new-client'

  // Default: new client — better to over-qualify than miss a lead
  return 'new-client'
}
