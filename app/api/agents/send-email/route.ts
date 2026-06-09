import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Arm, MessageType } from '@/lib/revenue-agents/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function verifyAgentAuth(req: NextRequest): boolean {
  const key = req.headers.get('x-agent-key') ?? req.headers.get('authorization')?.replace('Bearer ', '')
  return key === process.env.ACCESS_INTERNAL_KEY
}

// POST /api/agents/send-email
// Agents call this to send outreach emails via Resend.
// Body: { to, subject, body, arm, lead_id, message_type, from_name? }
// When MOCK_MODE=true, all emails redirect to jdevinwhite2@gmail.com with [MOCK TEST] prefix.
export async function POST(req: NextRequest) {
  if (!verifyAgentAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    to: string
    subject: string
    body: string
    arm: Arm
    lead_id?: string
    message_type: MessageType
    from_name?: string
    mock?: boolean
  }

  if (!body.to || !body.subject || !body.body || !body.arm || !body.message_type) {
    return NextResponse.json({ error: 'to, subject, body, arm, message_type required' }, { status: 400 })
  }

  const isMock = process.env.MOCK_MODE === 'true' || body.mock === true

  if (isMock) {
    const mockRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Jerry White <hello@jdwhite.world>',
        to: ['jdevinwhite2@gmail.com'],
        subject: `[MOCK TEST] [original → ${body.to}] ${body.subject}`,
        text: `--- MOCK TEST ---\nOriginal to: ${body.to}\nSubject: ${body.subject}\nArm: ${body.arm}\nMessage type: ${body.message_type}\n---\n${body.body}`,
      }),
    })

    const mockResult = await mockRes.json() as { id?: string; error?: { message?: string } }
    if (!mockRes.ok || mockResult.error) {
      return NextResponse.json({ ok: false, error: mockResult.error?.message ?? 'Resend mock error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, message_id: mockResult.id, mock: true })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })

  // Arm → from address mapping
  const fromMap: Record<Arm, string> = {
    consulting: 'Jerry White <hello@jdwhite.world>',
    'bridge-video': 'Bridge Video <hello@jdwhite.world>',
    access: 'ACCESS <notifications@jdwhite.world>',
    'wholesale-payments': 'Jerry White <hello@jdwhite.world>', // sends from verified domain, reply-to routes to WP email
  }

  const fromAddress = fromMap[body.arm] ?? 'Jerry White <hello@jdwhite.world>'

  const replyToMap: Partial<Record<Arm, string>> = {
    'wholesale-payments': 'jerry.white@wholesalepayments.com',
  }
  const replyTo = replyToMap[body.arm]

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [body.to],
      bcc: ['jdevinwhite2@gmail.com'],
      subject: body.subject,
      text: body.body,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  })

  const result = await res.json() as { id?: string; error?: { message?: string } }

  if (!res.ok || result.error) {
    const errMsg = result.error?.message ?? 'Resend API error'
    await supabase.from('agent_activity_logs').insert({
      agent_code: body.arm === 'consulting' ? 'REACH-CON' : 'REACH-BV',
      action: 'OUTREACH_SEND_FAILED',
      lead_id: body.lead_id,
      arm: body.arm,
      success: false,
      error: errMsg,
      details: { to: body.to, subject: body.subject, message_type: body.message_type },
    })
    return NextResponse.json({ ok: false, error: errMsg }, { status: 500 })
  }

  // Record in outreach_history (dedup guard — unique index prevents double-send)
  await supabase.from('outreach_history').upsert({
    email: body.to.toLowerCase().trim(),
    arm: body.arm,
    lead_id: body.lead_id,
    message_type: body.message_type,
    subject: body.subject,
    body_preview: body.body.slice(0, 120),
    provider_message_id: result.id,
  }, { onConflict: 'email,arm,message_type', ignoreDuplicates: true })

  // Increment lead outreach count
  if (body.lead_id) {
    const { data: lead } = await supabase
      .from('pipeline_leads')
      .select('outreach_count')
      .eq('id', body.lead_id)
      .single()
    if (lead) {
      await supabase.from('pipeline_leads').update({
        outreach_count: (lead.outreach_count ?? 0) + 1,
        last_outreach_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', body.lead_id)
    }
  }

  return NextResponse.json({ ok: true, message_id: result.id })
}
