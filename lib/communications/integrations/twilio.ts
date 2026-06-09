import { MOCK_DEPARTMENT_NUMBERS } from '../config'

export function generateTwilioTwiML(targetNumber?: string): string {
  const target = targetNumber ?? MOCK_DEPARTMENT_NUMBERS['hq']

  // TwiML that connects the call through the AI voice agent
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${process.env.VERCEL_URL ?? 'localhost:3000'}/api/communications/twilio/media-stream">
      <Parameter name="from" value="{{From}}" />
      <Parameter name="to" value="{{To}}" />
    </Stream>
  </Connect>
</Response>`
}

export function generateFallbackTwiML(targetNumber?: string): string {
  const target = targetNumber ?? MOCK_DEPARTMENT_NUMBERS['hq']
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Thank you for calling JD ACCESS. Your call is being routed. Please hold.
  </Say>
  <Dial timeout="20" record="record-from-answer">
    <Number>${target}</Number>
  </Dial>
  <Say voice="alice">
    We couldn't reach the team. Please leave a message after the tone.
  </Say>
  <Record maxLength="120" transcribe="true" transcribeCallback="/api/communications/twilio/transcript" />
</Response>`
}

export function generateForwardTwiML(toNumber: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="15" record="record-from-answer">
    <Number>${toNumber}</Number>
  </Dial>
</Response>`
}

export function parseTwilioBody(body: Record<string, string>): {
  from: string
  to: string
  callSid: string
  direction: 'inbound' | 'outbound'
} {
  return {
    from: body.From ?? body.from ?? '',
    to: body.To ?? body.to ?? '',
    callSid: body.CallSid ?? body.callSid ?? '',
    direction: 'inbound',
  }
}
