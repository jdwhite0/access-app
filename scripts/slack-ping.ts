/**
 * Send a test DM from the bot — proves tokens + chat:write work.
 * Run: npm run slack:ping
 */
import { loadAccessEnv } from '../lib/email/agents/load-env'
import { WebClient } from '@slack/web-api'

async function main() {
  loadAccessEnv()
  const botToken = process.env.SLACK_BOT_TOKEN?.trim()
  const targetUser = process.env.SLACK_ALLOWED_USER_IDS?.trim()?.split(',')[0]?.trim()

  if (!botToken?.startsWith('xoxb-')) {
    console.error('SLACK_BOT_TOKEN missing')
    process.exit(1)
  }
  if (!targetUser?.startsWith('U')) {
    console.error('Set SLACK_ALLOWED_USER_IDS=U... to your Slack member ID')
    process.exit(1)
  }

  const web = new WebClient(botToken)
  const opened = await web.conversations.open({ users: targetUser })
  const channel = opened.channel?.id
  if (!channel) {
    console.error('Could not open DM channel')
    process.exit(1)
  }

  const sent = await web.chat.postMessage({
    channel,
    text: [
      '✓ *ACCESS bot test ping*',
      'If you see this, the bot can reach you.',
      '',
      'Reply here with: `brief on platform infrastructure`',
      '',
      '_Make sure `npm run slack:bot` is running in your terminal._',
    ].join('\n'),
  })

  console.log(JSON.stringify({ ok: sent.ok, channel, ts: sent.ts, error: sent.error }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
