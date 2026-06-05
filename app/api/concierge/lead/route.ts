import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

const ALLOWED_ORIGINS = [
  'https://jdwhite.world',
  'https://www.jdwhite.world',
  'http://localhost:3000',
  'http://localhost:3001',
]

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin')
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  const headers = corsHeaders(origin)

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers })

  const { name, email, company, recommendation, answers } = body as {
    name?: string
    email?: string
    company?: string
    recommendation?: string
    answers?: Record<string, string>
  }

  if (!name?.trim() || !email?.trim() || !recommendation) {
    return NextResponse.json({ error: 'name, email, and recommendation are required' }, { status: 400, headers })
  }

  const validRecs = ['launch', 'grow', 'scale']
  if (!validRecs.includes(recommendation)) {
    return NextResponse.json({ error: 'Invalid recommendation' }, { status: 400, headers })
  }

  const lead = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    company: company?.trim() || null,
    recommendation,
    answers: answers ?? {},
  }

  // Store in Supabase
  const supabase = createSupabaseAdmin()
  if (supabase) {
    const { error } = await supabase.from('sales_leads').insert(lead)
    if (error) console.error('[concierge/lead] Supabase error:', error.message)
  }

  // Notify Jerry via email
  await notifyFounder(lead)

  return NextResponse.json({ ok: true }, { headers })
}

async function notifyFounder(lead: {
  name: string
  email: string
  company: string | null
  recommendation: string
  answers: Record<string, string>
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    console.info('[concierge/lead] No RESEND_API_KEY — lead notification not sent', lead.name, lead.email)
    return
  }

  const tierLabels: Record<string, string> = {
    launch: 'LAUNCH ($297+)',
    grow: 'GROW ($997+)',
    scale: 'SCALE ($5,000+)',
  }

  const answerLines = Object.entries(lead.answers)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n')

  const html = `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:8px;">
  <div style="background:#0A2540;color:#fff;padding:16px 20px;border-radius:6px 6px 0 0;">
    <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.6;">JD Productions — Sales Concierge</p>
    <h2 style="margin:6px 0 0;font-size:20px;font-weight:700;">New Lead — ${tierLabels[lead.recommendation] ?? lead.recommendation.toUpperCase()}</h2>
  </div>
  <div style="background:#fff;padding:20px;border-radius:0 0 6px 6px;border:1px solid #e5e7eb;border-top:none;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:8px 0;color:#6b7280;width:110px;">Name</td><td style="padding:8px 0;font-weight:600;">${lead.name}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;">Email</td><td style="padding:8px 0;"><a href="mailto:${lead.email}" style="color:#0A2540;">${lead.email}</a></td></tr>
      ${lead.company ? `<tr><td style="padding:8px 0;color:#6b7280;">Company</td><td style="padding:8px 0;">${lead.company}</td></tr>` : ''}
      <tr><td style="padding:8px 0;color:#6b7280;">Package</td><td style="padding:8px 0;font-weight:600;color:#169B48;">${tierLabels[lead.recommendation] ?? lead.recommendation}</td></tr>
    </table>
    ${answerLines ? `<div style="margin-top:16px;padding:12px;background:#f9fafb;border-radius:6px;font-size:13px;"><p style="margin:0 0 8px;font-weight:600;color:#374151;">Their answers:</p><pre style="margin:0;white-space:pre-wrap;color:#4b5563;">${answerLines}</pre></div>` : ''}
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;">
      <a href="mailto:${lead.email}?subject=Your%20JD%20Productions%20Project" style="display:inline-block;background:#0A2540;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;">Reply to ${lead.name} →</a>
    </div>
  </div>
</div>`

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'JD Productions <notifications@jdwhite.world>',
        to: [process.env.FOUNDER_TEST_EMAIL || 'jdevinwhite2@gmail.com'],
        subject: `New ${lead.recommendation.toUpperCase()} Lead — ${lead.name}${lead.company ? ` (${lead.company})` : ''}`,
        html,
      }),
    })
  } catch (e) {
    console.error('[concierge/lead] Email notification failed:', e)
  }
}
