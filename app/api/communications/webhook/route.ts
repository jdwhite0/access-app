import { NextRequest, NextResponse } from 'next/server'
import { processInboundEvent } from '@/lib/communications/agents/reception'
import { loadStoreFromSupabase, flushWrites } from '@/lib/communications/integrations/store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>

    // Validate webhook source (Quo/OpenPhone)
    const secret = process.env.QUO_WEBHOOK_SECRET
    const signature = req.headers.get('x-quo-signature') ?? req.headers.get('x-signature') ?? ''
    if (secret && signature !== secret) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    await loadStoreFromSupabase()

    const result = await processInboundEvent(body)
    if (!result.handled) {
      return NextResponse.json({ error: 'Unprocessable payload' }, { status: 422 })
    }

    await flushWrites()

    return NextResponse.json({
      ok: true,
      contact_id: result.contact?.id,
      lead_id: result.lead?.id,
      summary: result.summary,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
