import { VOICE_SYSTEM_PROMPT, POST_CALL_EXTRACTION_PROMPT } from './voice-agent'
import type { Lead } from '../types'
import { processInboundEvent } from '../agents/reception'
import { alertFounder, alertNewLead, alertSystem, postToChannel } from '../integrations/slack'
import { SLACK_CHANNELS } from '../config'

export interface CallResult {
  success: boolean
  summary?: string
  lead?: Lead
  transcript?: string
  duration_seconds?: number
}

export async function processVoiceCall(params: {
  fromNumber: string
  toNumber: string
  transcript: string
  durationSeconds?: number
  voicemailUrl?: string
}): Promise<CallResult> {
  const { fromNumber, toNumber, transcript, durationSeconds, voicemailUrl } = params

  // 1. Extract structured data from transcript using Gemini
  const extraction = await extractCallData(transcript)
  if (!extraction) {
    await alertSystem(`Voice call from ${fromNumber} — could not extract data from transcript`)
    return { success: false }
  }

  // 2. Feed into reception agent as an inbound event
  const eventPayload: Record<string, unknown> = {
    event_type: extraction.call_type === 'existing-client' ? 'new-call' : 'new-call',
    from_number: fromNumber,
    to_number: toNumber,
    sona_summary: extraction.call_summary,
    call_transcript: transcript,
    duration_seconds: durationSeconds,
    contact_name: extraction.name,
    voicemail_url: voicemailUrl,
  }

  const result = await processInboundEvent(eventPayload)

  // 3. Enrich the lead with voice-specific data
  if (result.lead) {
    result.lead.service_requested = extraction.service_interest as any
    result.lead.budget_range = extraction.budget_range ?? undefined
    result.lead.timeline = extraction.timeline ?? undefined
    result.lead.urgency = extraction.urgency as any
    result.lead.decision_maker_status = extraction.decision_maker_status as any
    result.lead.email = (extraction.email || result.lead.email) ?? undefined
    result.lead.company = (extraction.company || result.lead.company) ?? undefined
  }

  // 4. Priority alert for high-value calls
  if (extraction.callback_priority === 'high') {
    await alertFounder(
      `📞 *AI Voice Call — High Priority*\nCaller: ${extraction.name} (${fromNumber})\nCompany: ${extraction.company ?? 'N/A'}\nService: ${extraction.service_interest}\nBudget: ${extraction.budget_range ?? 'N/A'}\nTimeline: ${extraction.timeline ?? 'N/A'}\nSummary: ${extraction.call_summary}`
    )
  }

  // 5. Log to #hq channel
  const hqChannel = process.env.SLACK_CHANNEL_HQ ?? SLACK_CHANNELS.hq
  await postToChannel(hqChannel,
    `📞 *AI Call Handled*\nFrom: ${extraction.name} (${fromNumber})\nType: ${extraction.call_type}\nService: ${extraction.service_interest}\nSummary: ${extraction.call_summary}`
  )

  return {
    success: true,
    summary: extraction.call_summary,
    lead: result.lead,
    transcript,
    duration_seconds: durationSeconds,
  }
}

interface ExtractedCallData {
  call_summary: string
  name: string
  company: string | null
  phone: string
  email: string | null
  service_interest: string
  budget_range: string | null
  timeline: string | null
  urgency: string
  decision_maker_status: string
  call_type: string
  needs_callback: boolean
  callback_priority: string
  key_details: string[]
  suggested_department: string
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
  ])
}

async function extractCallData(transcript: string): Promise<ExtractedCallData | null> {
  try {
    const { generateJson } = await import('@/lib/revenue-agents/ai-provider')
    const result = await withTimeout(
      generateJson<ExtractedCallData>(
        POST_CALL_EXTRACTION_PROMPT,
        `Extract data from this call transcript:\n\n${transcript}`,
        { maxTokens: 2048 }
      ),
      15000
    )
    return result.data
  } catch {
    // Fallback: extract name/phone from transcript with basic regex
    const nameMatch = transcript.match(/my name is (\w+\s?\w+)/i)
    const phoneMatch = transcript.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/)
    return {
      call_summary: transcript.slice(0, 100),
      name: nameMatch?.[1] ?? 'Unknown Caller',
      company: null,
      phone: phoneMatch?.[1] ?? 'unknown',
      email: null,
      service_interest: 'unclear',
      budget_range: null,
      timeline: null,
      urgency: 'unknown',
      decision_maker_status: 'unknown',
      call_type: 'new-client',
      needs_callback: true,
      callback_priority: 'medium',
      key_details: [],
      suggested_department: 'hq',
    }
  }
}
