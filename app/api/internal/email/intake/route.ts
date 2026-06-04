import { NextResponse } from 'next/server'
import { assertInternalEmailAuth } from '@/lib/email/agents/config'
import { runEmailIntakePipeline } from '@/lib/email/agents/pipeline'
import type { EmailIntakePayload } from '@/lib/email/agents/types'

export async function POST(req: Request) {
  const secret = req.headers.get('x-internal-email-secret')
  if (!assertInternalEmailAuth(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: EmailIntakePayload
  try {
    body = (await req.json()) as EmailIntakePayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.source_type || !body.payload) {
    return NextResponse.json({ error: 'source_type and payload required' }, { status: 400 })
  }

  const result = await runEmailIntakePipeline(body)
  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}