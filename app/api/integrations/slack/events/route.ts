import { NextRequest, NextResponse } from 'next/server'
import { verifySlackSignature, isAllowedSlackUser } from '@/lib/slack/verify'
import { slackPostMessage } from '@/lib/slack/client'
import { handleOperatorMessagePlain } from '@/lib/operator/handle-message'

type SlackEventPayload = {
  type?: string
  challenge?: string
  event?: {
    type?: string
    text?: string
    user?: string
    channel?: string
    ts?: string
    bot_id?: string
    subtype?: string
  }
}

async function processSlackMessage(event: NonNullable<SlackEventPayload['event']>): Promise<void> {
  if (event.bot_id || event.subtype === 'bot_message') return
  if (!event.text || !event.channel || !event.ts) return
  if (!isAllowedSlackUser(event.user)) {
    await slackPostMessage({
      channel: event.channel,
      text: 'ACCESS operator is restricted to authorized users.',
      threadTs: event.ts,
    })
    return
  }

  const reply = await handleOperatorMessagePlain(event.text)
  await slackPostMessage({ channel: event.channel, text: reply, threadTs: event.ts })
}

/**
 * Slack Events API — DMs and @mentions to ACCESS Intelligence bot.
 * POST /api/integrations/slack/events
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

  const payload = JSON.parse(rawBody) as SlackEventPayload

  if (payload.type === 'url_verification' && payload.challenge) {
    return NextResponse.json({ challenge: payload.challenge })
  }

  const event = payload.event
  const isDm = event?.channel?.startsWith('D')
  const isMention = event?.type === 'app_mention'
  const isImMessage = event?.type === 'message' && isDm

  if (event && (isMention || isImMessage)) {
    void processSlackMessage(event).catch(async (err) => {
      const msg = err instanceof Error ? err.message : String(err)
      if (event.channel && event.ts) {
        await slackPostMessage({
          channel: event.channel,
          text: `✗ Operator error: ${msg}`,
          threadTs: event.ts,
        })
      }
    })
  }

  return NextResponse.json({ ok: true })
}
