/**
 * Local Slack operator bot — Socket Mode + DM poll fallback.
 * Receives your replies even when Slack event subscriptions are misconfigured.
 *
 * Run: npm run slack:bot
 */
import { SocketModeClient } from '@slack/socket-mode'
import { WebClient } from '@slack/web-api'
import { loadAccessEnv } from '../lib/email/agents/load-env'
import { handleOperatorMessage } from '../lib/operator/handle-message'
import { isAllowedSlackUser } from '../lib/slack/verify'
import { startAutonomousScheduler } from './autonomous-scheduler'

const PROCESSED = new Set<string>()
const POLL_MS = 6000

function markProcessed(key: string): boolean {
  if (PROCESSED.has(key)) return false
  PROCESSED.add(key)
  if (PROCESSED.size > 500) {
    const first = PROCESSED.values().next().value
    if (first) PROCESSED.delete(first)
  }
  return true
}

function isDirectMessage(channel: string | undefined): boolean {
  return Boolean(channel?.startsWith('D'))
}

function shouldHandleMessageEvent(event: {
  type?: string
  channel?: string
  subtype?: string
  bot_id?: string
}): boolean {
  if (event.bot_id) return false
  if (event.subtype && event.subtype !== 'file_share') return false
  if (event.type === 'app_mention') return true
  if (event.type === 'message' && isDirectMessage(event.channel)) return true
  return false
}

async function runOperator(input: {
  web: WebClient
  botUserId: string
  text: string
  userId: string
  channelId: string
  threadTs: string
  via: 'event' | 'poll'
}): Promise<void> {
  const { web, text, userId, channelId, threadTs, via } = input
  const dedupeKey = `${channelId}:${threadTs}`
  if (!markProcessed(dedupeKey)) return

  console.log(`[slack:bot] ${via} ←`, text.slice(0, 120))

  if (!isAllowedSlackUser(userId)) {
    await web.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      text: `Blocked — your ID is \`${userId}\`. Update SLACK_ALLOWED_USER_IDS in .env.local (must match your Slack member ID).`,
    })
    return
  }

  await web.reactions.add({ channel: channelId, timestamp: threadTs, name: 'hourglass_flowing_sand' }).catch(() => {})

  // Immediate ack for send commands so Jerry knows it's working
  const normalized = text.toLowerCase().replace(/[^a-z\s]/g, '').trim()
  if (normalized === 'send it' || normalized === 'send') {
    await web.chat.postMessage({ channel: channelId, thread_ts: threadTs, text: 'On it — sending your brief now.' }).catch(() => {})
  }

  // Progress heartbeat — only fires for slow ops (research). Fast replies finish first.
  const HEARTBEAT_FIRST_MS = 20_000
  const HEARTBEAT_EVERY_MS = 35_000
  const stages = [
    '🔍 Researching — gathering market signals…',
    '📊 Scoring evidence and signal strength…',
    '🧠 Synthesizing the operator read…',
    '📝 Drafting the brief — almost there…',
    '⏳ Still working — deep topics take a few minutes…',
  ]
  let stageIndex = 0
  let firstTimer: NodeJS.Timeout | undefined
  let loopTimer: NodeJS.Timeout | undefined

  const postBeat = () => {
    const msg = stages[Math.min(stageIndex, stages.length - 1)]
    stageIndex += 1
    web.chat.postMessage({ channel: channelId, text: `_${msg}_` }).catch(() => {})
  }

  firstTimer = setTimeout(() => {
    postBeat()
    loopTimer = setInterval(postBeat, HEARTBEAT_EVERY_MS)
  }, HEARTBEAT_FIRST_MS)

  const stopHeartbeat = () => {
    if (firstTimer) clearTimeout(firstTimer)
    if (loopTimer) clearInterval(loopTimer)
  }

  try {
    const result = await handleOperatorMessage(text, {
      slackUserId: userId,
      channelId,
      threadTs,
    })
    stopHeartbeat()

    for (const msg of result.messages) {
      await web.chat.postMessage({ channel: channelId, text: msg })
    }
    await web.reactions.add({ channel: channelId, timestamp: threadTs, name: 'white_check_mark' }).catch(() => {})
  } finally {
    stopHeartbeat()
  }
}

async function main() {
  loadAccessEnv()

  // Never let a research crash or stray rejection kill the listener.
  process.on('uncaughtException', (err) => {
    console.error('[slack:bot] uncaughtException (staying alive):', err)
  })
  process.on('unhandledRejection', (reason) => {
    console.error('[slack:bot] unhandledRejection (staying alive):', reason)
  })

  const appToken = process.env.SLACK_APP_TOKEN?.trim()
  const botToken = process.env.SLACK_BOT_TOKEN?.trim()
  const allowedUsers =
    process.env.SLACK_ALLOWED_USER_IDS?.trim()?.split(',').map((s) => s.trim()).filter(Boolean) ?? []

  if (!appToken?.startsWith('xapp-') || !botToken?.startsWith('xoxb-')) {
    console.error('[slack:bot] Missing SLACK_APP_TOKEN or SLACK_BOT_TOKEN in access-app/.env.local')
    process.exit(1)
  }

  const web = new WebClient(botToken)
  const auth = await web.auth.test()
  if (!auth.ok || !auth.user_id) {
    console.error('[slack:bot] Invalid bot token:', auth.error)
    process.exit(1)
  }

  const botUserId = auth.user_id
  console.log(`[slack:bot] Connected as @${auth.user} (${botUserId})`)
  console.log('[slack:bot] Allowed users:', allowedUsers.length ? allowedUsers.join(', ') : 'ALL')

  // --- DM poll fallback (works without message.im event subscription) ---
  const pollChannels = new Map<string, string>() // channelId → last seen ts

  async function bootstrapPollChannel(userId: string): Promise<string | null> {
    try {
      const opened = await web.conversations.open({ users: userId })
      const channelId = opened.channel?.id
      if (!channelId) return null

      const hist = await web.conversations.history({ channel: channelId, limit: 1 })
      const latest = hist.messages?.[0]?.ts
      if (latest) pollChannels.set(channelId, latest)
      else pollChannels.set(channelId, '0')
      console.log(`[slack:bot] polling DM ${channelId} for user ${userId}`)
      return channelId
    } catch (err) {
      console.error('[slack:bot] poll setup failed for', userId, err)
      return null
    }
  }

  // Bootstrap DM channels and capture founder's channel for scheduler notifications
  let founderDmChannel: string | null = null
  for (const userId of allowedUsers) {
    const ch = await bootstrapPollChannel(userId)
    if (!founderDmChannel && ch) founderDmChannel = ch
  }

  // THE MODE — autonomous daily brief at 7 AM ET, no manual trigger needed
  if (founderDmChannel) {
    const dmChannel = founderDmChannel
    startAutonomousScheduler({
      sendToSlack: async (message: string) => {
        await web.chat.postMessage({ channel: dmChannel, text: message }).catch((err) => {
          console.error('[scheduler] Slack notify failed:', err)
        })
      },
    })
  } else {
    console.warn('[scheduler] No founder DM channel — autonomous scheduler will not send Slack updates')
    startAutonomousScheduler({ sendToSlack: async (msg) => console.log('[scheduler→stdout]', msg) })
  }

  setInterval(async () => {
    for (const [channelId] of pollChannels) {
      try {
        const lastTs = pollChannels.get(channelId) ?? '0'
        const hist = await web.conversations.history({
          channel: channelId,
          oldest: lastTs,
          limit: 10,
          inclusive: false,
        })

        const messages = (hist.messages ?? []).slice().reverse()
        for (const msg of messages) {
          if (!msg.ts || !msg.user || msg.user === botUserId || msg.bot_id) continue
          if (parseFloat(msg.ts) <= parseFloat(lastTs)) continue

          pollChannels.set(channelId, msg.ts)
          const text = (msg.text ?? '').replace(/<@[^>]+>/g, '').trim()
          if (!text) continue

          await runOperator({
            web,
            botUserId,
            text,
            userId: msg.user,
            channelId,
            threadTs: msg.ts,
            via: 'poll',
          }).catch((err) => {
            console.error('[slack:bot] poll handler error', err)
          })
        }
      } catch (err) {
        console.error('[slack:bot] poll error', channelId, err)
      }
    }
  }, POLL_MS)

  console.log(`[slack:bot] DM poll fallback active (every ${POLL_MS / 1000}s)`)

  // --- Socket Mode (instant when events configured) ---
  const socket = new SocketModeClient({ appToken })

  socket.on('events_api', async ({ body, ack }) => {
    await ack()
    const event = body.event as {
      type?: string
      text?: string
      user?: string
      channel?: string
      ts?: string
      bot_id?: string
      subtype?: string
    } | undefined

    if (!event || !shouldHandleMessageEvent(event)) return
    if (!event.text || !event.channel || !event.ts || !event.user) return

    await runOperator({
      web,
      botUserId,
      text: event.text.replace(/<@[^>]+>/g, '').trim(),
      userId: event.user,
      channelId: event.channel,
      threadTs: event.ts,
      via: 'event',
    }).catch(async (err) => {
      const msg = err instanceof Error ? err.message : String(err)
      await web.chat.postMessage({ channel: event.channel!, thread_ts: event.ts!, text: `✗ ${msg}` })
    })
  })

  socket.on('slash_commands', async ({ body, ack }) => {
    await ack()
    const text = (body.text ?? 'help').trim()
    console.log('[slack:bot] slash', text)
    try {
      const result = await handleOperatorMessage(text, {
        slackUserId: body.user_id,
        channelId: body.channel_id,
        threadTs: body.trigger_id,
      })
      await web.chat.postEphemeral({
        channel: body.channel_id,
        user: body.user_id,
        text: result.messages.join('\n\n'),
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await web.chat.postEphemeral({ channel: body.channel_id, user: body.user_id, text: `✗ ${msg}` })
    }
  })

  socket.on('error', (err) => console.error('[slack:bot] socket error', err))

  await socket.start()
  console.log('[slack:bot] ✓ Ready — reply in the ping DM thread')
}

main().catch((err) => {
  console.error('[slack:bot] fatal', err)
  process.exit(1)
})
