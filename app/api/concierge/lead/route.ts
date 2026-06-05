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

  let leadId: string | null = null
  const supabase = createSupabaseAdmin()
  if (supabase) {
    const { data, error } = await supabase
      .from('sales_leads')
      .insert(lead)
      .select('id')
      .single()
    if (error) console.error('[concierge/lead] Supabase error:', error.message)
    leadId = data?.id ?? null
  }

  await Promise.all([
    notifyFounder(lead),
    confirmLead(lead, leadId),
  ])

  return NextResponse.json({ ok: true }, { headers })
}

// ─── Tier config ───────────────────────────────────────────────────────────────

const TIER = {
  launch: {
    label:      'LAUNCH',
    package:    'LAUNCH Package · $297+',
    color:      '#7B9CFF',   // signal blue — LOW urgency
    urgency:    'LOW',
    replyHours: 48,
    action:     'Book intro call',
    desc:       'We start at the foundation.',
  },
  grow: {
    label:      'GROW',
    package:    'GROW Package · $997+',
    color:      '#FFB547',   // amber — MEDIUM urgency
    urgency:    'MEDIUM',
    replyHours: 24,
    action:     'Schedule discovery call',
    desc:       'We expand what\'s working.',
  },
  scale: {
    label:      'SCALE',
    package:    'SCALE Package · $5,000+',
    color:      '#FF5F5F',   // red — HIGH urgency
    urgency:    'HIGH',
    replyHours: 12,
    action:     'Book architecture session',
    desc:       'We build the full infrastructure.',
  },
} as const

type Tier = keyof typeof TIER

// ─── EMAIL 1: Internal Signal (Mission Control) ────────────────────────────────

async function notifyFounder(lead: {
  name: string
  email: string
  company: string | null
  recommendation: string
  answers: Record<string, string>
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    console.info('[concierge/lead] No RESEND_API_KEY — skipping founder notify')
    return
  }

  const tier = TIER[lead.recommendation as Tier] ?? TIER.launch
  const now = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })

  const answerRows = Object.entries(lead.answers)
    .map(([k, v]) => `
      <tr>
        <td style="padding:7px 0 7px;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
          font-size:10px;letter-spacing:0.10em;text-transform:uppercase;
          color:rgba(255,255,255,0.28);width:110px;vertical-align:top;
          border-bottom:1px solid rgba(255,255,255,0.05);">${k}</td>
        <td style="padding:7px 0 7px;font-size:13px;line-height:1.5;
          color:rgba(255,255,255,0.65);
          border-bottom:1px solid rgba(255,255,255,0.05);">${v}</td>
      </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#030407;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
  style="background:#030407;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%"
  style="max-width:560px;background:#0A0C14;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">

  <!-- Urgency signal line -->
  <tr>
    <td>
      <div style="height:2px;background:linear-gradient(90deg,${tier.color} 0%,rgba(255,255,255,0.08) 70%,transparent 100%);"></div>
    </td>
  </tr>

  <!-- Header with urgency atmosphere -->
  <tr>
    <td bgcolor="#030407" style="
      padding:20px 24px 16px;
      background:
        radial-gradient(ellipse at 50% 0%, ${tier.color}18 0%, transparent 55%),
        #030407;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
              font-size:11px;font-weight:700;letter-spacing:0.20em;
              color:rgba(255,255,255,0.88);">JDWHITE.WORLD</p>
            <p style="margin:3px 0 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
              font-size:10px;letter-spacing:0.14em;
              color:rgba(255,255,255,0.25);">COMMAND CENTER · DEPT 01</p>
          </td>
          <td align="right" style="vertical-align:top;">
            <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
              font-size:10px;letter-spacing:0.06em;color:rgba(255,255,255,0.22);">${now}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Divider -->
  <tr><td style="padding:0 24px;">
    <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
  </td></tr>

  <!-- Signal Status (C-03) -->
  <tr>
    <td style="padding:16px 24px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:12px;vertical-align:middle;">
            <!-- Urgency glow ring -->
            <div style="display:inline-block;
              padding:5px;
              border:1px solid ${tier.color}28;
              border-radius:50%;">
              <div style="width:8px;height:8px;
                background:${tier.color};
                border-radius:50%;"></div>
            </div>
          </td>
          <td>
            <span style="font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
              font-size:11px;font-weight:700;letter-spacing:0.14em;
              color:${tier.color};">${tier.urgency}</span>
            <span style="font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
              font-size:11px;letter-spacing:0.10em;
              color:rgba(255,255,255,0.35);margin-left:10px;">NEW LEAD DETECTED</span>
          </td>
        </tr>
      </table>
      <p style="margin:6px 0 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
        font-size:10px;letter-spacing:0.10em;
        color:rgba(255,255,255,0.22);">jdwhite.world · Work With Me · ${tier.label} path</p>
    </td>
  </tr>

  <!-- Headline (C-02) -->
  <tr>
    <td style="padding:18px 24px 20px;">
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;
        font-size:26px;font-weight:700;letter-spacing:-0.02em;line-height:1.15;
        color:rgba(255,255,255,0.92);">${lead.name}${lead.company
    ? `<br/><span style="font-size:17px;font-weight:400;font-style:italic;color:rgba(255,255,255,0.38);">${lead.company}</span>`
    : ''}</p>
    </td>
  </tr>

  <!-- Info card (C-04) -->
  <tr>
    <td style="padding:0 24px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
          border-radius:8px;overflow:hidden;">
        <tr><td style="padding:4px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
                font-size:10px;letter-spacing:0.10em;text-transform:uppercase;
                color:rgba(255,255,255,0.25);width:110px;
                border-bottom:1px solid rgba(255,255,255,0.05);">EMAIL</td>
              <td style="padding:8px 0;font-size:14px;
                border-bottom:1px solid rgba(255,255,255,0.05);">
                <a href="mailto:${lead.email}" style="color:${tier.color};text-decoration:none;">${lead.email}</a>
              </td>
            </tr>
            ${lead.company ? `
            <tr>
              <td style="padding:8px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
                font-size:10px;letter-spacing:0.10em;text-transform:uppercase;
                color:rgba(255,255,255,0.25);
                border-bottom:1px solid rgba(255,255,255,0.05);">COMPANY</td>
              <td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.65);
                border-bottom:1px solid rgba(255,255,255,0.05);">${lead.company}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:8px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
                font-size:10px;letter-spacing:0.10em;text-transform:uppercase;
                color:rgba(255,255,255,0.25);">PACKAGE</td>
              <td style="padding:8px 0;font-size:14px;font-weight:700;color:${tier.color};">${tier.package}</td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- Intent / Answers (C-09 surface) -->
  ${answerRows ? `
  <tr>
    <td style="padding:0 24px 20px;">
      <p style="margin:0 0 8px;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
        font-size:10px;letter-spacing:0.14em;text-transform:uppercase;
        color:rgba(255,255,255,0.22);">THEIR ANSWERS</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:8px;">
        <tr><td style="padding:4px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${answerRows}
          </table>
        </td></tr>
      </table>
    </td>
  </tr>` : ''}

  <!-- Divider -->
  <tr><td style="padding:0 24px 16px;">
    <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
  </td></tr>

  <!-- Next Action (C-08) -->
  <tr>
    <td style="padding:0 24px 20px;">
      <p style="margin:0 0 10px;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
        font-size:10px;letter-spacing:0.14em;text-transform:uppercase;
        color:rgba(255,255,255,0.28);">NEXT ACTION</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="background:rgba(255,255,255,0.03);border:1px solid ${tier.color}28;
          border-radius:8px;overflow:hidden;">
        <tr><td style="padding:4px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
                font-size:10px;letter-spacing:0.10em;text-transform:uppercase;
                color:rgba(255,255,255,0.25);width:110px;
                border-bottom:1px solid rgba(255,255,255,0.05);">ACTION</td>
              <td style="padding:8px 0;font-size:14px;font-weight:600;
                color:rgba(255,255,255,0.88);
                border-bottom:1px solid rgba(255,255,255,0.05);">
                Reply within ${tier.replyHours} hours
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
                font-size:10px;letter-spacing:0.10em;text-transform:uppercase;
                color:rgba(255,255,255,0.25);
                border-bottom:1px solid rgba(255,255,255,0.05);">RESPONSE</td>
              <td style="padding:8px 0;font-size:14px;color:rgba(255,255,255,0.65);
                border-bottom:1px solid rgba(255,255,255,0.05);">${tier.action}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
                font-size:10px;letter-spacing:0.10em;text-transform:uppercase;
                color:rgba(255,255,255,0.25);">PRIORITY</td>
              <td style="padding:8px 0;">
                <span style="display:inline-flex;align-items:center;gap:6px;">
                  <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${tier.color};"></span>
                  <span style="font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
                    font-size:11px;font-weight:700;letter-spacing:0.12em;color:${tier.color};">${tier.urgency}</span>
                </span>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding:0 24px 32px;">
      <a href="mailto:${lead.email}?subject=Re%3A%20Your%20Work%20With%20Me%20Inquiry"
        style="display:inline-block;padding:13px 24px;background:${tier.color};
          color:#030407;text-decoration:none;border-radius:7px;
          font-family:system-ui,-apple-system,sans-serif;
          font-size:14px;font-weight:700;letter-spacing:-0.01em;">
        Reply to ${lead.name} →
      </a>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:16px 24px 20px;border-top:1px solid rgba(255,255,255,0.05);">
      <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
        font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.15);">
        JDWHITE.WORLD · COMMAND CENTER · DEPT 01
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body></html>`

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'JD White <notifications@jdwhite.world>',
        to: [process.env.FOUNDER_TEST_EMAIL || 'jdevinwhite2@gmail.com'],
        subject: `${tier.urgency} · New Lead — ${lead.name} · ${tier.label}`,
        html,
      }),
    })
  } catch (e) {
    console.error('[concierge/lead] Founder notify failed:', e)
  }
}

// ─── EMAIL 2: External Confirmation — light layout, readable for all ages ────────

async function confirmLead(
  lead: { name: string; email: string; company: string | null; recommendation: string; answers: Record<string, string> },
  leadId: string | null,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return

  const tier = TIER[lead.recommendation as Tier] ?? TIER.launch

  // Progress tracker — light mode
  const progressHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 24px;">
      <tr>
        <!-- Active step -->
        <td align="center" style="width:25%;">
          <div style="width:12px;height:12px;border-radius:50%;
            background:#7B9CFF;margin:0 auto 8px;"></div>
          <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
            font-size:9px;letter-spacing:0.10em;text-transform:uppercase;
            color:#0D0D14;">Received</p>
        </td>
        <td style="padding-bottom:18px;">
          <div style="height:1px;background:#E4E2EE;"></div>
        </td>
        <td align="center" style="width:25%;">
          <div style="width:10px;height:10px;border-radius:50%;
            border:1px solid #D0CEDC;margin:0 auto 8px;"></div>
          <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
            font-size:9px;letter-spacing:0.10em;text-transform:uppercase;
            color:#9A9AAA;">Reviewed</p>
        </td>
        <td style="padding-bottom:18px;">
          <div style="height:1px;background:#E4E2EE;"></div>
        </td>
        <td align="center" style="width:25%;">
          <div style="width:10px;height:10px;border-radius:50%;
            border:1px solid #D0CEDC;margin:0 auto 8px;"></div>
          <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
            font-size:9px;letter-spacing:0.10em;text-transform:uppercase;
            color:#9A9AAA;">In Touch</p>
        </td>
        <td style="padding-bottom:18px;">
          <div style="height:1px;background:#E4E2EE;"></div>
        </td>
        <td align="center" style="width:25%;">
          <div style="width:10px;height:10px;border-radius:50%;
            border:1px solid #D0CEDC;margin:0 auto 8px;"></div>
          <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
            font-size:9px;letter-spacing:0.10em;text-transform:uppercase;
            color:#9A9AAA;">Building</p>
        </td>
      </tr>
    </table>`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
</head>
<body style="margin:0;padding:0;background:#EDEBF7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
  style="background:linear-gradient(160deg,#EDEBF7 0%,#F5F3FC 22%,#FAFAF8 100%);padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%"
  style="max-width:560px;background:#FFFFFF;border-radius:10px;overflow:hidden;
    border:1px solid #E4E2EE;box-shadow:0 2px 8px rgba(60,40,120,0.10);">

  <!-- ─── MASTHEAD: dark void · portal mark · publication banner ─── -->
  <tr>
    <td align="center" bgcolor="#06070D" style="
      padding:40px 28px 32px;
      background:
        radial-gradient(ellipse at 50% 30%, rgba(123,156,255,0.18) 0%, transparent 62%),
        #06070D;">

      <!-- Portal mark — 3 concentric rings (globe equivalent) -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 22px;">
        <tr>
          <td width="80" height="80" align="center" valign="middle"
            style="border:1px solid rgba(123,156,255,0.18);border-radius:40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td width="54" height="54" align="center" valign="middle"
                  style="border:1px solid rgba(123,156,255,0.32);border-radius:27px;">
                  <div style="width:10px;height:10px;background:#7B9CFF;border-radius:5px;margin:0 auto;"></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Publication banner — "THE DAILY BRIEF" equivalent -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="background:#7B9CFF;padding:10px 30px;">
            <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
              font-size:14px;font-weight:700;letter-spacing:0.22em;color:#FFFFFF;
              text-align:center;">WORK WITH ME</p>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- ─── COLLABORATION BLOCK: "Together with Founder Office" ─── -->
  <tr>
    <td align="center" bgcolor="#FFFFFF" style="padding:24px 28px 20px;background:#FFFFFF;">
      <p style="margin:0 0 6px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
        font-size:13px;color:#9A9AAA;letter-spacing:0.01em;">In collaboration with</p>
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;
        font-size:24px;font-weight:700;letter-spacing:-0.02em;color:#0D0D14;">Founder Office</p>
    </td>
  </tr>

  <!-- ─── SIGNAL DIVIDER ─── -->
  <tr>
    <td style="padding:0;">
      <div style="height:2px;background:linear-gradient(90deg,#7B9CFF 0%,rgba(123,156,255,0.25) 65%,transparent 100%);"></div>
    </td>
  </tr>

  <!-- Wordmark + date -->
  <tr>
    <td style="padding:20px 28px 0;background:#FFFFFF;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
              font-size:11px;font-weight:700;letter-spacing:0.20em;color:#0D0D14;">JDWHITE.WORLD</p>
          </td>
          <td align="right" style="vertical-align:top;">
            <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
              font-size:10px;letter-spacing:0.08em;color:#9A9AAA;">
              ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Headline + divider -->
  <tr>
    <td style="padding:16px 28px 22px;border-bottom:1px solid #E4E2EE;">
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;
        font-size:28px;font-weight:700;letter-spacing:-0.02em;line-height:1.2;
        color:#0D0D14;">Here's what happens next.</p>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:24px 28px 8px;">

      <!-- Path block -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="margin:0 0 22px;background:#F4F2FA;border:1px solid #E0DDEF;border-radius:8px;">
        <tr><td style="padding:4px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:10px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
                font-size:10px;letter-spacing:0.12em;text-transform:uppercase;
                color:#9A9AAA;width:130px;border-bottom:1px solid #E4E2EE;">WHERE YOU ARE</td>
              <td style="padding:10px 0;font-size:16px;color:#0D0D14;
                border-bottom:1px solid #E4E2EE;">Under review</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
                font-size:10px;letter-spacing:0.12em;text-transform:uppercase;
                color:#9A9AAA;">WHAT'S NEXT</td>
              <td style="padding:10px 0;font-size:16px;color:#0D0D14;">
                I'll reach out within ${tier.replyHours} hours
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      <!-- Tier badge -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
        <tr>
          <td align="center">
            <div style="display:inline-block;padding:14px 24px;
              border:1px solid ${tier.color}40;border-radius:8px;
              background:${tier.color}0F;text-align:center;">
              <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
                font-size:11px;font-weight:700;letter-spacing:0.16em;
                color:${tier.color};">${tier.label} PACKAGE</p>
              <p style="margin:5px 0 0;font-family:system-ui,-apple-system,sans-serif;
                font-size:15px;color:#5A5A68;">${tier.desc}</p>
            </div>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <div style="height:1px;background:#E4E2EE;margin:0 0 22px;"></div>

      <!-- Progress tracker -->
      <p style="margin:0 0 14px;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
        font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#9A9AAA;">PROGRESS</p>
      ${progressHtml}

      <!-- Divider -->
      <div style="height:1px;background:#E4E2EE;margin:0 0 22px;"></div>

      <!-- Founder block -->
      <p style="margin:0 0 16px;font-size:16px;line-height:1.72;
        color:#0D0D14;font-family:system-ui,-apple-system,sans-serif;">
        I read every one of these. Not a team, not an assistant&nbsp;—&nbsp;me.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.72;
        color:#0D0D14;font-family:system-ui,-apple-system,sans-serif;">
        The goal isn't to pitch you something. It's to find out if what you're
        building is something I should be a part of.
      </p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.72;
        color:#0D0D14;font-family:system-ui,-apple-system,sans-serif;">
        You'll hear from me within ${tier.replyHours} hours.
      </p>

      <!-- Signature -->
      <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;
        font-size:16px;font-style:italic;color:#5A5A68;">— JD White</p>
      <p style="margin:0 0 28px;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
        font-size:10px;letter-spacing:0.10em;color:#9A9AAA;">
        FOUNDER, JD PRODUCTIONS
      </p>

      <!-- CTA -->
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
        <tr>
          <td style="border-radius:7px;background:#7B9CFF;">
            <a href="https://jdwhite.world"
              style="display:inline-block;padding:14px 26px;
                font-family:system-ui,-apple-system,sans-serif;
                font-size:15px;font-weight:600;color:#FFFFFF;
                text-decoration:none;letter-spacing:-0.01em;">
              Explore the ecosystem →
            </a>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:20px 28px 24px;border-top:1px solid #E4E2EE;">
      <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;
        font-size:10px;letter-spacing:0.08em;color:#9A9AAA;text-align:center;">
        JDWHITE.WORLD · <a href="https://jdwhite.world" style="color:#9A9AAA;text-decoration:none;">jdwhite.world</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body></html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.JDW_EMAIL_FROM || 'JD White <hello@jdwhite.world>',
        to: [lead.email],
        subject: 'Got it.',
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[concierge/lead] Confirmation failed:', err)
      return
    }

    const supabase = createSupabaseAdmin()
    if (supabase) {
      await supabase.from('jdw_email_log').insert({
        recipient_email: lead.email,
        email_type: 'concierge_confirmation',
        track: 'business_dev',
        lead_id: leadId,
        subject: 'Got it.',
        status: 'sent',
        automation_stage: 1,
      })
    }
  } catch (e) {
    console.error('[concierge/lead] Confirmation exception:', e)
  }
}
