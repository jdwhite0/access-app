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

  const tierColors: Record<string, string> = {
    launch: '#169B48',
    grow: '#1A8FA0',
    scale: '#C9A46A',
  }
  const tierColor = tierColors[lead.recommendation] ?? '#169B48'

  const answerRows = Object.entries(lead.answers)
    .map(([k, v]) => `
      <tr>
        <td style="padding:7px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.10em;text-transform:uppercase;color:rgba(255,255,255,0.30);width:100px;vertical-align:top;">${k}</td>
        <td style="padding:7px 0;font-size:13px;color:rgba(255,255,255,0.70);">${v}</td>
      </tr>`)
    .join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#07080F;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#07080F;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;">

      <!-- Header -->
      <tr>
        <td style="padding:0 0 24px;">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.90);">JD Productions</p>
          <p style="margin:4px 0 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.28);">Sales Concierge · Department 01</p>
        </td>
      </tr>

      <!-- Rule -->
      <tr><td style="padding:0 0 24px;"><div style="height:1px;background:rgba(255,255,255,0.08);"></div></td></tr>

      <!-- Tier badge -->
      <tr>
        <td style="padding:0 0 20px;">
          <span style="display:inline-block;padding:5px 14px;border-radius:100px;background:${tierColor}18;border:1px solid ${tierColor}40;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${tierColor};">${tierLabels[lead.recommendation] ?? lead.recommendation.toUpperCase()}</span>
        </td>
      </tr>

      <!-- Headline -->
      <tr>
        <td style="padding:0 0 28px;">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;letter-spacing:-0.02em;line-height:1.15;color:rgba(255,255,255,0.92);">New lead — ${lead.name}${lead.company ? `<br/><span style="font-size:18px;font-weight:400;font-style:italic;color:rgba(255,255,255,0.45);">${lead.company}</span>` : ''}</p>
        </td>
      </tr>

      <!-- Lead details card -->
      <tr>
        <td style="padding:0 0 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0D1018;border:1px solid rgba(255,255,255,0.07);border-radius:10px;overflow:hidden;">
            <tr>
              <td style="padding:16px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:7px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.10em;text-transform:uppercase;color:rgba(255,255,255,0.30);width:100px;vertical-align:top;">Name</td>
                    <td style="padding:7px 0;font-size:14px;font-weight:600;color:rgba(255,255,255,0.88);">${lead.name}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.10em;text-transform:uppercase;color:rgba(255,255,255,0.30);width:100px;">Email</td>
                    <td style="padding:7px 0;font-size:14px;"><a href="mailto:${lead.email}" style="color:${tierColor};text-decoration:none;">${lead.email}</a></td>
                  </tr>
                  ${lead.company ? `<tr><td style="padding:7px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.10em;text-transform:uppercase;color:rgba(255,255,255,0.30);width:100px;">Company</td><td style="padding:7px 0;font-size:14px;color:rgba(255,255,255,0.70);">${lead.company}</td></tr>` : ''}
                  <tr>
                    <td style="padding:7px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.10em;text-transform:uppercase;color:rgba(255,255,255,0.30);width:100px;">Package</td>
                    <td style="padding:7px 0;font-size:14px;font-weight:700;color:${tierColor};">${tierLabels[lead.recommendation] ?? lead.recommendation}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Answers card -->
      ${answerRows ? `
      <tr>
        <td style="padding:0 0 24px;">
          <p style="margin:0 0 10px;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.28);">Their answers</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0D1018;border:1px solid rgba(255,255,255,0.07);border-radius:10px;">
            <tr><td style="padding:14px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${answerRows}</table></td></tr>
          </table>
        </td>
      </tr>` : ''}

      <!-- CTA -->
      <tr>
        <td style="padding:0 0 40px;">
          <a href="mailto:${lead.email}?subject=Your%20JD%20Productions%20Project%20—%20Let%27s%20Talk" style="display:inline-block;padding:13px 24px;background:${tierColor};color:#ffffff;text-decoration:none;border-radius:7px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:600;letter-spacing:-0.01em;">Reply to ${lead.name} →</a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:20px 0 0;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.18);">JD Productions · jdwhite.world · Sales Concierge · Department 01</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body></html>`

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
