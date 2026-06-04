import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/email/feedback?dossier=...&email=...&rating=useful|not_useful
 * Records subscriber engagement — no auth required (email link).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const dossier = params.get('dossier')?.trim()
  const email = params.get('email')?.trim()?.toLowerCase()
  const rating = params.get('rating')?.trim()

  if (!dossier || !email || !rating) {
    return NextResponse.json({ error: 'Missing dossier, email, or rating' }, { status: 400 })
  }

  if (rating !== 'useful' && rating !== 'not_useful' && rating !== 'hot' && rating !== 'alright' && rating !== 'meh') {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()
  if (supabase) {
    await supabase.from('email_delivery_logs').insert({
      email,
      email_type: 'feedback',
      category: 'daily_brief',
      status: 'sent',
      metadata: {
        dossier_id: dossier,
        rating,
        source: 'email_feedback_link',
      },
    })
  }

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? request.nextUrl.origin
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Feedback received</title></head>
<body style="font-family:system-ui,sans-serif;background:#0a0b10;color:#e8eaef;padding:40px;text-align:center;">
<h1 style="font-size:20px;">Thank you</h1>
<p style="color:#8b92a8;">Your feedback on this brief was recorded.</p>
<p><a href="${base}/dashboard" style="color:#6eb5ff;">Return to ACCESS</a></p>
</body></html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
