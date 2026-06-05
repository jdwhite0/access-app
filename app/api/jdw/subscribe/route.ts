import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import {
  renderJDWEmailHtml,
  jdwLede,
  jdwParagraph,
  jdwStep,
  jdwDivider,
  jdwCTA,
  jdwSignature,
} from '@/lib/email/templates/layout-jdw'

const ALLOWED_ORIGINS = [
  'https://jdwhite.world',
  'https://www.jdwhite.world',
  'http://localhost:3000',
  'http://localhost:3001',
]

type SubscribeSource =
  | 'newsletter'
  | 'ecosystem'
  | 'founder_dispatch'
  | 'product_updates'
  | 'field_notes'

type SelectedPath =
  | 'founder'
  | 'ecosystem'
  | 'product'
  | 'builder'
  | 'observer'

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

  const {
    email,
    name,
    source,
    selected_path,
    interest_tags,
  } = body as {
    email?: string
    name?: string
    source?: SubscribeSource
    selected_path?: SelectedPath
    interest_tags?: string[]
  }

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400, headers })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400, headers })
  }

  const validSources: SubscribeSource[] = [
    'newsletter', 'ecosystem', 'founder_dispatch', 'product_updates', 'field_notes',
  ]
  const resolvedSource: SubscribeSource = validSources.includes(source as SubscribeSource)
    ? (source as SubscribeSource)
    : 'newsletter'

  const subscriber = {
    email: email.trim().toLowerCase(),
    name: name?.trim() || null,
    source: resolvedSource,
    selected_path: selected_path ?? null,
    interest_tags: interest_tags ?? [],
    subscriber_status: 'confirmed', // no double opt-in for now — add later if needed
    automation_stage: 1,
  }

  // Store in Supabase
  let subscriberId: string | null = null
  const supabase = createSupabaseAdmin()
  if (supabase) {
    const { data, error } = await supabase
      .from('jdw_subscribers')
      .upsert(subscriber, { onConflict: 'email,source', ignoreDuplicates: false })
      .select('id')
      .single()
    if (error) console.error('[jdw/subscribe] Supabase error:', error.message)
    subscriberId = data?.id ?? null
  }

  // Send welcome email
  const emailResult = await sendWelcomeEmail(subscriber, subscriberId)

  return NextResponse.json({ ok: true, source: resolvedSource, emailSent: emailResult }, { headers })
}

async function sendWelcomeEmail(
  subscriber: { email: string; name: string | null; source: string; selected_path: string | null },
  subscriberId: string | null,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return false

  const firstName = subscriber.name?.split(' ')[0] || null
  const greeting = firstName ? `${firstName}.` : 'You made it.'

  const pathDescriptions: Record<string, string> = {
    founder:   'You want to think like a founder, build like one, and operate like one.',
    ecosystem: 'You\'re watching how this whole thing connects.',
    product:   'You\'re here for ACCESS, JYSON, VAULT, and what we\'re building.',
    builder:   'You want to build something. We\'ll talk soon.',
    observer:  'You\'re watching. Good. The system rewards attention.',
  }

  const pathLine = subscriber.selected_path && pathDescriptions[subscriber.selected_path]
    ? jdwParagraph(pathDescriptions[subscriber.selected_path])
    : ''

  const sourceLabels: Record<string, string> = {
    newsletter:       'the newsletter',
    ecosystem:        'the ecosystem',
    founder_dispatch: 'founder dispatches',
    product_updates:  'product updates',
    field_notes:      'field notes',
  }
  const sourceLabel = sourceLabels[subscriber.source] ?? 'the ecosystem'

  const bodyHtml = [
    jdwLede(greeting),
    jdwParagraph(`You're on the list for ${sourceLabel}. No spam. No noise. Just signal when something worth reading exists.`),
    pathLine,
    jdwDivider(),
    jdwParagraph('Here\'s what to expect:'),
    jdwStep('01', '<strong>Real dispatches</strong> — not template emails. When I write, it\'s because there\'s something worth saying.'),
    jdwStep('02', '<strong>Ecosystem updates</strong> — when a new world goes live, when something ships, when the system moves.'),
    jdwStep('03', '<strong>No frequency games</strong> — I\'d rather send one great email a month than seven weak ones.'),
    jdwDivider(),
    jdwCTA('Explore the ecosystem →', 'https://jdwhite.world'),
    jdwSignature(),
  ].join('')

  const html = renderJDWEmailHtml({
    track: 'ecosystem',
    subject: 'Signal received.',
    preheader: 'You\'re on the list. Here\'s what happens next.',
    bodyHtml,
    recipientEmail: subscriber.email,
  })

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.JDW_EMAIL_FROM || process.env.EMAIL_FROM || 'JD White <hello@jdwhite.world>',
        to: [subscriber.email],
        subject: 'Signal received.',
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[jdw/subscribe] Resend error:', err)
      return false
    }

    // Log the send
    const supabase = createSupabaseAdmin()
    if (supabase) {
      await supabase.from('jdw_email_log').insert({
        recipient_email: subscriber.email,
        email_type: 'welcome_ecosystem',
        track: 'ecosystem',
        subscriber_id: subscriberId,
        subject: 'Signal received.',
        status: 'sent',
        automation_stage: 1,
      })
    }

    return true
  } catch (e) {
    console.error('[jdw/subscribe] Email send failed:', e)
    return false
  }
}
