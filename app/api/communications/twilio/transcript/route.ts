import { NextRequest, NextResponse } from 'next/server'
import { loadStoreFromSupabase, flushWrites } from '@/lib/communications/integrations/store'

/**
 * POST /api/communications/twilio/transcript
 *
 * Called by Twilio when a voicemail transcription is ready.
 */
export async function POST(req: NextRequest) {
  try {
    await loadStoreFromSupabase()
    const formData = await req.formData()
    const body: Record<string, string> = {}
    formData.forEach((val, key) => { body[key] = val.toString() })

    const { processInboundEvent } = await import('@/lib/communications/agents/reception')
    const { alertSystem } = await import('@/lib/communications/integrations/slack')

    const fromNumber = body.From ?? body.from ?? ''
    const transcriptionText = body.TranscriptionText ?? body.transcriptionText ?? ''

    if (transcriptionText) {
      await processInboundEvent({
        event_type: 'new-voicemail',
        from_number: fromNumber,
        to_number: body.To ?? '',
        voicemail_transcript: transcriptionText,
        timestamp: new Date().toISOString(),
      })

      await alertSystem(`Voicemail from ${body.CallerName ?? fromNumber}: "${transcriptionText.slice(0, 200)}"`)
    }

    await flushWrites()
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await flushWrites().catch(() => {})
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
