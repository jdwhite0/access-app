import { NextRequest, NextResponse } from 'next/server'
import { verifySlackSignature, isAllowedSlackUser } from '@/lib/slack/verify'
import { handleOperatorMessagePlain } from '@/lib/operator/handle-message'

/**
 * Slack slash command: /access [message]
 * POST /api/integrations/slack/commands
 */
export async function POST(request: NextRequest) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET?.trim()
  if (!signingSecret) {
    return NextResponse.json({ error: 'Slack not configured' }, { status: 503 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-slack-signature')
  const timestamp = request.headers.get('x-slack-request-timestamp')

  if (!verifySlackSignature({ signingSecret, signature, timestamp, rawBody })) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const params = new URLSearchParams(rawBody)
  const userId = params.get('user_id') ?? undefined
  const text = params.get('text')?.trim() ?? 'help'

  if (!isAllowedSlackUser(userId)) {
    return new NextResponse('Unauthorized', { status: 200 })
  }

  const reply = await handleOperatorMessagePlain(text)
  return new NextResponse(reply, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
