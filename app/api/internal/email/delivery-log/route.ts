import { NextResponse } from 'next/server'
import { assertInternalEmailAuth } from '@/lib/email/agents/config'
import { logEmailDelivery } from '@/lib/email/agents/delivery-log-db'

export async function POST(req: Request) {
  const secret = req.headers.get('x-internal-email-secret')
  if (!assertInternalEmailAuth(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.status) {
    return NextResponse.json({ error: 'email and status required' }, { status: 400 })
  }

  const log = await logEmailDelivery({
    send_queue_id: body.send_queue_id,
    user_id: body.user_id,
    email: body.email,
    email_type: body.email_type,
    category: body.category,
    status: body.status,
    provider_message_id: body.provider_message_id,
    error_message: body.error_message,
    metadata: body.metadata,
  })

  return NextResponse.json({ ok: true, log })
}
