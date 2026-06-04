import { parseOperatorIntent, helpText } from '@/lib/operator/parse-intent'
import {
  sendDailyBrief,
  runCursorResearch,
  listAvailableTopics,
  resolveTopicDossier,
  jdaiEngineRoot,
} from '@/lib/operator/pipeline'
import { loadBriefForReview } from '@/lib/operator/load-brief-preview'
import { formatSlackBriefPreview, splitSlackMessage } from '@/lib/operator/slack-preview'
import {
  savePendingReview,
  loadPendingReview,
  clearPendingReview,
} from '@/lib/operator/slack-review-store'
import { fetchDailyBriefSnapshot } from '@/lib/email/agents/intake-snapshot'
import { existsSync } from 'node:fs'

export type OperatorContext = {
  slackUserId: string
  channelId: string
  threadTs: string
}

export type OperatorReply = {
  messages: string[]
}

function reply(text: string): OperatorReply {
  return { messages: splitSlackMessage(text) }
}

async function postReviewToSlack(
  ctx: OperatorContext,
  topic?: string
): Promise<OperatorReply> {
  const loaded = await loadBriefForReview({ topic })
  if (!loaded.ok) {
    const topicLabel = topic ?? 'that topic'
    return reply(
      [
        `*No brief on "${topicLabel}" yet.*`,
        '',
        'Nothing in the library — I can\'t preview what doesn\'t exist.',
        '',
        `Reply: \`research ${topicLabel}\` — I'll research, post preview here, then you say *send it*`,
        '',
        'Or try: `list topics` for what\'s ready now',
        '• platform infrastructure',
        '• agent orchestration',
      ].join('\n')
    )
  }

  const { preview } = loaded
  await savePendingReview({
    slack_user_id: ctx.slackUserId,
    channel_id: ctx.channelId,
    thread_ts: ctx.threadTs,
    source_id: preview.source_id,
    json_path: preview.jsonPath,
    topic: preview.topic,
  })

  const previewText = formatSlackBriefPreview(preview)
  return reply(previewText)
}

export async function executeOperatorIntent(
  intent: ReturnType<typeof parseOperatorIntent>,
  ctx?: OperatorContext
): Promise<OperatorReply> {
  const needsCtx = ['review', 'approve_send', 'research', 'send_now', 'clarify'].includes(intent.type)
  if (needsCtx && !ctx) {
    return reply('Internal error: missing Slack context.')
  }

  switch (intent.type) {
    case 'help':
      return reply(helpText())

    case 'status': {
      const snapshot = await fetchDailyBriefSnapshot()
      const pending = ctx ? await loadPendingReview(ctx.slackUserId) : null
      const engine = jdaiEngineRoot()
      return reply(
        [
          '*ACCESS Operator Status*',
          `• JDAI engine: ${existsSync(engine) ? '✓' : '✗'}`,
          `• Test mode: ${process.env.EMAIL_TEST_MODE !== 'false' ? 'founder only' : 'PRODUCTION'}`,
          `• Published snapshot: ${snapshot?.intake.source_id ?? 'none'}`,
          pending ? `• Pending review: \`${pending.topic}\` — reply *send it*` : '• Pending review: none',
        ].join('\n')
      )
    }

    case 'list_topics': {
      const topics = listAvailableTopics()
      if (!topics.length) return reply('No topics yet. Say `research [topic]` to create one.')
      return reply(
        '*Available topics:*\n' +
          topics.map((t) => `• \`${t.slug}\`${t.json ? ' ✓' : ''}`).join('\n') +
          '\n\nSay `brief on [slug]` to preview in Slack.'
      )
    }

    case 'cancel': {
      if (ctx) await clearPendingReview(ctx.slackUserId)
      return reply('Cancelled. Pending brief cleared.')
    }

    case 'review':
      return postReviewToSlack(ctx!, intent.topic)

    case 'approve_send': {
      const pending = await loadPendingReview(ctx!.slackUserId)
      if (!pending) {
        return reply(
          [
            'Nothing is waiting to send.',
            '',
            'Start with: `research [topic]` or `brief on [existing topic]`',
            'I\'ll post a preview here — then *send it*.',
          ].join('\n')
        )
      }
      const result = await sendDailyBrief({ dossierPath: pending.json_path })
      await clearPendingReview(ctx!.slackUserId)
      if (!result.ok) return reply(`✗ Send failed: ${result.error}`)
      return reply(
        [
          '✓ *Brief sent to your inbox* (founder test mode)',
          `• Topic: ${pending.topic}`,
          `• ID: \`${result.source_id}\``,
          `• Delivered: ${result.sent ?? 0}`,
          '',
          '_Finimize-style layout · check your email_',
        ].join('\n')
      )
    }

    case 'send_now': {
      // Named topic must resolve to a real dossier — never silently send the wrong one.
      if (intent.topic) {
        const dossierPath = resolveTopicDossier(intent.topic)
        if (!dossierPath) {
          return reply(
            [
              `*No brief on "${intent.topic}" exists yet.*`,
              '',
              `Reply \`research ${intent.topic}\` to create one, then *send it*.`,
              'Or `list topics` to see what\'s ready.',
            ].join('\n')
          )
        }
        const result = await sendDailyBrief({ dossierPath })
        if (!result.ok) return reply(`✗ ${result.error}`)
        return reply(
          `✓ Sent *${result.source_id}* to your inbox (${result.sent ?? 0} delivered).`
        )
      }

      // No topic = send the most recent dossier (the one "you just made")
      const result = await sendDailyBrief({})
      if (!result.ok) return reply(`✗ ${result.error}`)
      return reply(
        `✓ Sent the latest brief *${result.source_id}* to your inbox (${result.sent ?? 0} delivered).`
      )
    }

    case 'research': {
      const existing = intent.topic ? resolveTopicDossier(intent.topic) : null
      if (existing) {
        return postReviewToSlack(ctx!, intent.topic)
      }

      const cursor = await runCursorResearch(intent.topic)
      if (!cursor.ok) {
        return reply(
          [
            `*Can't research "${intent.topic}" yet*`,
            cursor.message,
            '',
            'Options:',
            '• Run research in Cursor chat, then `brief on [topic]` here',
            '• Set `CURSOR_API_KEY` for research-from-Slack',
            '• `list topics` for what\'s ready now',
          ].join('\n')
        )
      }

      const afterResearch = await loadBriefForReview({ topic: intent.topic })
      if (afterResearch.ok) {
        return postReviewToSlack(ctx!, intent.topic)
      }

      return reply(
        [
          '✓ *Research complete*',
          cursor.message.slice(0, 2000),
          '',
          afterResearch.ok ? '' : `Preview: ${afterResearch.error}`,
          'Say `brief on ' + intent.topic + '` when dossier is ready.',
        ]
          .filter(Boolean)
          .join('\n')
      )
    }

    case 'clarify': {
      // Ambiguous text — never auto-launch a multi-minute research run.
      // If a brief is waiting, nudge toward send/cancel. Otherwise confirm research.
      const pending = ctx ? await loadPendingReview(ctx.slackUserId) : null
      if (pending) {
        return reply(
          [
            `I have a brief on *${pending.topic}* waiting.`,
            '',
            `Reply *send it* to email it, or *cancel* to discard.`,
            `(I didn't recognize "${intent.raw}" as a command.)`,
          ].join('\n')
        )
      }
      return reply(
        [
          `I didn't catch a command in "${intent.raw}".`,
          '',
          `Did you want to research it? Reply:`,
          `\`research ${intent.raw}\``,
          '',
          'Or: `list topics` · `status` · `help`',
        ].join('\n')
      )
    }

    default:
      return reply(helpText())
  }
}

export async function handleOperatorMessage(
  text: string,
  ctx?: OperatorContext
): Promise<OperatorReply> {
  const intent = parseOperatorIntent(text)
  return executeOperatorIntent(intent, ctx)
}

/** Legacy single-string handler for slash commands. */
export async function handleOperatorMessagePlain(text: string): Promise<string> {
  const result = await handleOperatorMessage(text)
  return result.messages.join('\n\n')
}
