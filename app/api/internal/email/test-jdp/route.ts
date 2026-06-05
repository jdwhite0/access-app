import { NextRequest, NextResponse } from 'next/server'
import {
  renderJDPEmailHtml,
  jdpSectionLabel,
  jdpLede,
  jdpParagraph,
  jdpBullet,
  jdpPullQuote,
  jdpCTA,
  jdpDivider,
  type JDPVenture,
} from '@/lib/email/templates/layout-jdp'

const VALID_VENTURES: JDPVenture[] = [
  'jd-productions', 'bridge-video', 'white-lane', 'linc',
  'the-collection', 'lil-dev', 'jerry-devin', 'access',
  'regal', 'walking-paintbrush',
]

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-email-secret')
  if (secret !== process.env.INTERNAL_EMAIL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ error: 'No RESEND_API_KEY' }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const venture: JDPVenture = VALID_VENTURES.includes(body.venture) ? body.venture : 'jd-productions'
  const to: string = body.to || process.env.FOUNDER_TEST_EMAIL || 'jdevinwhite2@gmail.com'

  const bodyHtml = [
    jdpSectionLabel('🏗️', 'What we build', venture),
    jdpLede('Systems that generate revenue before you check your phone.', venture),
    jdpParagraph('JD Productions partners with founders who are done building things that look good but don\'t pay. Every engagement starts with a diagnosis — we find the gap between what you have and what your business actually needs to run.'),
    jdpDivider(),

    jdpSectionLabel('💡', 'The approach', venture),
    jdpParagraph('Three phases. No fluff.'),
    jdpBullet('01', '<strong>Diagnose</strong> — Audit your current systems, identify the revenue leak, map the fix.'),
    jdpBullet('02', '<strong>Build</strong> — Infrastructure, automation, and content that compounds over time.'),
    jdpBullet('03', '<strong>Deploy</strong> — Live, tracked, and tied to a number you can measure.'),
    jdpDivider(),

    jdpSectionLabel('📌', 'Who this is for', venture),
    jdpPullQuote(
      'You\'re not looking for a vendor. You\'re looking for someone who thinks the way you do — and builds faster.',
      'Jerry Devin, Founder',
      venture,
    ),
    jdpParagraph('If you\'re a founder with traction but fragmented systems — this is the conversation worth having.'),

    jdpCTA('Work with JD Productions →', 'https://jdwhite.world/work-with-me/', venture),
  ].join('')

  const html = renderJDPEmailHtml({
    venture,
    subject: 'Build what comes next.',
    preheader: 'Systems that generate revenue before you check your phone.',
    issue: 'June 2026 · No. 001',
    readMinutes: 2,
    bodyHtml,
  })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'JD Productions <notifications@jdwhite.world>',
      to: [to],
      subject: `[TEST] Build what comes next. — JD Productions`,
      html,
    }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return NextResponse.json({ error: 'Resend failed', detail: data }, { status: 502 })
  }

  return NextResponse.json({ ok: true, venture, to, resend: data })
}
