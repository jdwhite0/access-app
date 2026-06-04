import { NextResponse } from 'next/server'
import { assertInternalEmailAuth } from '@/lib/email/agents/config'
import { dispatchDueQueuedEmails } from '@/lib/email/agents/pipeline'

export async function POST(req: Request) {
  const secret = req.headers.get('x-internal-email-secret')
  if (!assertInternalEmailAuth(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const limit = Number(url.searchParams.get('limit') ?? '25')
  const result = await dispatchDueQueuedEmails(Number.isFinite(limit) ? limit : 25)
  return NextResponse.json({ ok: true, ...result })
}
