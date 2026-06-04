import { NextResponse } from 'next/server'
import { assertInternalEmailAuth } from '@/lib/email/agents/config'
import { insertQueueItem } from '@/lib/email/agents/queue-db'

export async function POST(req: Request) {
  const secret = req.headers.get('x-internal-email-secret')
  if (!assertInternalEmailAuth(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.email_type || !body?.category || !body?.html_body) {
    return NextResponse.json(
      { error: 'email, email_type, category, html_body required' },
      { status: 400 }
    )
  }

  const { row, error } = await insertQueueItem({
    user_id: body.user_id ?? null,
    email: body.email,
    email_type: body.email_type,
    category: body.category,
    subject: body.subject ?? 'ACCESS',
    preview_text: body.preview_text,
    html_body: body.html_body,
    text_body: body.text_body,
    scheduled_for: body.scheduled_for ?? new Date().toISOString(),
    status: body.status ?? 'queued',
    idempotency_key: body.idempotency_key,
    metadata: body.metadata ?? {},
  })

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ ok: true, queue: row })
}
