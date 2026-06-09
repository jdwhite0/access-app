import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createSupabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/communications/twilio/outbound
 * 
 * Initiate an outbound AI call via Twilio pointing to the Gemini WebSocket server.
 * 
 * Request body:
 *   - leadId: UUID of the lead in pipeline_leads
 *   - phoneNumber: target phone number
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { leadId, phoneNumber } = body

    if (!leadId || !phoneNumber) {
      return NextResponse.json({ error: 'Missing leadId or phoneNumber' }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
    const fromNumber = process.env.TWILIO_PHONE_NUMBER?.trim()
    const wsServerHost = process.env.WS_SERVER_HOST?.trim() || process.env.VERCEL_URL || 'your-ws-server.com'

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 })
    }

    // Verify lead exists and get script
    const supabase = createSupabaseAdmin()
    let script = 'You are the sales outreach agent calling to schedule a follow-up discovery call.'
    
    if (supabase) {
      const { data: lead } = await supabase
        .from('pipeline_leads')
        .select('*')
        .eq('id', leadId)
        .maybeSingle()
      
      if (lead) {
        const customScript = lead.raw_data?.callbacks?.[0]?.suggested_script || 
                             lead.raw_data?.suggested_script ||
                             lead.notes
        if (customScript) {
          script = customScript
        }
      }
    }

    const client = twilio(accountSid, authToken)

    // Build outbound TwiML connecting the call to the media stream
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${wsServerHost}/api/communications/twilio/media-stream">
      <Parameter name="leadId" value="${leadId}" />
      <Parameter name="direction" value="outbound" />
    </Stream>
  </Connect>
</Response>`

    console.log(`[twilio-outbound] Initiating call to ${phoneNumber} from ${fromNumber}...`)
    
    // Check if in test mode
    if (process.env.MOCK_MODE === 'true') {
      console.log(`[MOCK MODE] Outbound call would be placed via Twilio with TwiML:\n${twiml}`)
      return NextResponse.json({
        ok: true,
        mock: true,
        callSid: `mock-call-sid-${Date.now()}`,
        twiml,
      })
    }

    const call = await client.calls.create({
      twiml,
      to: phoneNumber,
      from: fromNumber,
    })

    return NextResponse.json({
      ok: true,
      callSid: call.sid,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[twilio-outbound] Call failed:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
