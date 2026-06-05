import { parseOperatorIntent, helpText } from '@/lib/operator/parse-intent'
import {
  sendDailyBrief,
  runClaudeResearch,
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
  intent: Awaited<ReturnType<typeof parseOperatorIntent>>,
  ctx?: OperatorContext
): Promise<OperatorReply> {
  const needsCtx = ['review', 'approve_send', 'research', 'send_now', 'clarify'].includes(intent.type)
  if (needsCtx && !ctx) {
    return reply("Something went wrong on my end — I lost the conversation context. Try sending that again.")
  }

  switch (intent.type) {
    case 'ignore':
      return { messages: [] }

    case 'help':
      return reply(helpText())

    case 'status': {
      const snapshot = await fetchDailyBriefSnapshot()
      const pending = ctx ? await loadPendingReview(ctx.slackUserId) : null
      const engine = jdaiEngineRoot()
      const engineOk = existsSync(engine) || engine.includes('/tmp')
      return reply(
        [
          '*System check*',
          `• Research engine: ${engineOk ? '✓ ready' : '✗ not connected — tell Jerry'}`,
          `• Email mode: ${process.env.EMAIL_TEST_MODE !== 'false' ? 'sending to you only (test mode)' : 'live — goes to all subscribers'}`,
          `• Last brief: ${snapshot?.intake.source_id ?? 'none yet'}`,
          pending ? `• Waiting to send: *${pending.topic}* — say *send it* when ready` : '• Nothing waiting to send',
        ].join('\n')
      )
    }

    case 'list_topics': {
      const topics = listAvailableTopics()
      if (!topics.length) return reply("No briefs on file yet. Say something like *research AI tools for operators* and I'll get started.")
      return reply(
        "*Here's what I have ready:*\n" +
          topics.map((t) => `• ${t.slug}${t.json ? ' ✓' : ''}`).join('\n') +
          '\n\nSay *brief on [topic]* to pull up a preview.'
      )
    }

    case 'cancel': {
      if (ctx) await clearPendingReview(ctx.slackUserId)
      return reply("Got it — cleared. Nothing waiting to send anymore.")
    }

    case 'review':
      return postReviewToSlack(ctx!, intent.topic)

    case 'approve_send': {
      const pending = await loadPendingReview(ctx!.slackUserId)
      if (!pending) {
        return reply(
          [
            "Nothing is queued up to send right now.",
            '',
            "Start by saying *research [topic]* — I'll pull the intel, show you a preview, and then you say *send it*.",
          ].join('\n')
        )
      }
      const result = await sendDailyBrief({ dossierPath: pending.json_path })
      await clearPendingReview(ctx!.slackUserId)
      if (!result.ok) {
        return reply(
          [
            `Couldn't send the brief — something went wrong on the email side.`,
            result.error ? `_${result.error}_` : '',
            '',
            'Try saying *send it* again, or *research [topic]* to start fresh.',
          ].filter(Boolean).join('\n')
        )
      }
      return reply(
        [
          `✓ *THE MODE brief is in your inbox.*`,
          `Topic: ${pending.topic}`,
          `Delivered to: ${result.sent ?? 0} recipient${(result.sent ?? 0) === 1 ? '' : 's'}`,
        ].join('\n')
      )
    }

    case 'send_now': {
      if (intent.topic) {
        const dossierPath = resolveTopicDossier(intent.topic)
        if (!dossierPath) {
          return reply(
            [
              `I don't have a brief on *${intent.topic}* yet.`,
              '',
              `Say *research ${intent.topic}* and I'll build one. Then say *send it*.`,
              'Or say *list topics* to see what I already have.',
            ].join('\n')
          )
        }
        const result = await sendDailyBrief({ dossierPath })
        if (!result.ok) {
          return reply(`Couldn't send that one — ${result.error ?? 'something went wrong on the email side'}. Try again in a moment.`)
        }
        return reply(`✓ Sent to your inbox. (${result.sent ?? 0} delivered)`)
      }

      const result = await sendDailyBrief({})
      if (!result.ok) {
        return reply(`Couldn't send the latest brief — ${result.error ?? 'something went wrong'}. Try again in a moment.`)
      }
      return reply(`✓ Latest brief sent to your inbox. (${result.sent ?? 0} delivered)`)
    }

    case 'research': {
      const existing = intent.topic ? resolveTopicDossier(intent.topic) : null
      if (existing) {
        return postReviewToSlack(ctx!, intent.topic)
      }

      const research = await runClaudeResearch(intent.topic)
      if (!research.ok) {
        return reply(
          [
            `Couldn't pull that research together.`,
            '',
            research.message,
            '',
            'Want to try again? You can rephrase it or pick a different angle.',
          ].join('\n')
        )
      }

      const afterResearch = await loadBriefForReview({ dossierPath: research.jsonPath })
      if (!afterResearch.ok) {
        return reply(
          [
            '✓ Research finished, but I had trouble loading the preview.',
            `Say *brief on ${intent.topic}* to try pulling it up again.`,
          ].join('\n')
        )
      }

      const { preview } = afterResearch
      await savePendingReview({
        slack_user_id: ctx!.slackUserId,
        channel_id: ctx!.channelId,
        thread_ts: ctx!.threadTs,
        source_id: preview.source_id,
        json_path: preview.jsonPath,
        topic: preview.topic,
      })
      return reply(formatSlackBriefPreview(preview))
    }

    case 'clarify': {
      const pending = ctx ? await loadPendingReview(ctx.slackUserId) : null
      if (pending) {
        return reply(
          [
            `I have a brief on *${pending.topic}* ready to go.`,
            `Say *send it* to email it, or *cancel* if you want to start over.`,
          ].join('\n')
        )
      }
      return reply(
        [
          `Not sure what you mean by: _"${intent.raw}"_`,
          '',
          "Just talk to me like normal — here's what I can do:",
          '• *research [anything]* — I\'ll pull intel and build a brief',
          '• *send it* — emails the brief you just approved',
          '• *list topics* — see what I already have on file',
          '• *status* — check if everything is running',
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
  const intent = await parseOperatorIntent(text)
  return executeOperatorIntent(intent, ctx)
}

/** Legacy single-string handler for slash commands. */
export async function handleOperatorMessagePlain(text: string): Promise<string> {
  const result = await handleOperatorMessage(text)
  return result.messages.join('\n\n')
}
