import { NextRequest, NextResponse } from 'next/server'
import { generateFallbackTwiML, parseTwilioBody } from '@/lib/communications/integrations/twilio'
import { processInboundEvent } from '@/lib/communications/agents/reception'
import { alertSystem } from '@/lib/communications/integrations/slack'
import { loadStoreFromSupabase, flushWrites } from '@/lib/communications/integrations/store'

/**
 * POST /api/communications/twilio/voice
 *
 * Called by Twilio when an inbound call arrives.
 * Returns TwiML that either:
 *   - Routes to AI voice agent (Gemini) via Media Streams
 *   - Falls back to call forwarding if voice agent unavailable
 */
export async function POST(req: NextRequest) {
  try {
    await loadStoreFromSupabase()
    const formData = await req.formData()
    const body: Record<string, string> = {}
    formData.forEach((val, key) => { body[key] = val.toString() })

    const { from, to, callSid } = parseTwilioBody(body)
    if (!from) return new NextResponse(generateFallbackTwiML(), { headers: { 'Content-Type': 'text/xml' } })

    // Log the incoming call via reception agent
    await processInboundEvent({
      event_type: 'new-call',
      from_number: from,
      to_number: to,
      call_id: callSid,
      timestamp: new Date().toISOString(),
    }).catch(() => {})

    const agentAvailable = !!process.env.GOOGLE_API_KEY

    if (agentAvailable) {
      await flushWrites()
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${process.env.VERCEL_URL ?? 'localhost:3000'}/api/communications/twilio/media-stream">
      <Parameter name="from" value="${from}" />
      <Parameter name="to" value="${to}" />
      <Parameter name="callSid" value="${callSid}" />
    </Stream>
  </Connect>
</Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    await flushWrites()
    return new NextResponse(generateFallbackTwiML(), { headers: { 'Content-Type': 'text/xml' } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await alertSystem(`Twilio voice webhook error: ${msg}`)
    await flushWrites().catch(() => {})
    return new NextResponse(generateFallbackTwiML(), { headers: { 'Content-Type': 'text/xml' } })
  }
}
