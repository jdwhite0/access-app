export type OperatorIntent =
  | { type: 'help' }
  | { type: 'status' }
  | { type: 'list_topics' }
  | { type: 'review'; topic?: string }
  | { type: 'approve_send' }
  | { type: 'cancel' }
  | { type: 'send_now'; topic?: string }
  | { type: 'research'; topic: string; draft_only?: boolean }
  | { type: 'ignore' }
  | { type: 'clarify'; raw: string }

const HELP_TEXT = `*ACCESS Intelligence — Slack Operator*

Just talk. I understand plain English.

*Research any topic:*
• "what ETFs should I buy tomorrow?"
• "research the creator economy in 2026"
• "what's happening with AI agents right now?"
→ I research, post a preview here, then you say *send it*.

*Review an existing brief:*
• "show me the openai brief"
• "pull up the platform infrastructure one"

*Approve & send:* "yes", "send it", "looks good", "go"
*Skip review:* "send the openai brief now"
*Other:* \`list topics\` · \`status\` · \`cancel\``

/** Affirmative "send the brief I just reviewed" — tolerant of typos. */
function isApproveSend(t: string): boolean {
  const cleaned = t.replace(/[!.?]+$/, '').trim()
  const APPROVE = new Set([
    'send it', 'sent it', 'snd it', 'sed it', 'send that', 'send this',
    'send', 'sent', 'send email', 'send the email', 'email it', 'email that',
    'send the brief', 'send brief', 'ship it', 'ship', 'approve', 'approved',
    'go', 'go ahead', 'do it', 'send it please', 'yes send', 'yes send it',
    'yep', 'yeah send it', 'looks good send', 'send now',
  ])
  if (APPROVE.has(cleaned)) return true
  if (['yes', 'yeah', 'yep', 'yup', 'ok', 'okay', 'sure', 'confirmed'].includes(cleaned)) return true
  return false
}

function isCancel(t: string): boolean {
  const cleaned = t.replace(/[!.?]+$/, '').trim()
  return [
    'cancel', 'discard', 'nevermind', 'never mind', 'nvm', 'stop', 'no',
    'nope', 'scrap it', 'scrap', 'forget it', 'drop it',
  ].includes(cleaned)
}

/** Fast regex path — handles unambiguous commands without an API call. */
function parseOperatorIntentSync(text: string): OperatorIntent | null {
  const raw = text.trim().replace(/<@[A-Z0-9]+>/g, '').trim()
  const t = raw.toLowerCase()

  // URLs and Slack message links — never process, no reply
  if (/^https?:\/\//i.test(raw) || /^<https?:\/\//i.test(raw)) return { type: 'ignore' }
  if (!t) return { type: 'ignore' }

  if (t === 'help' || t === '?' || t === 'commands') return { type: 'help' }
  if (t === 'status') return { type: 'status' }
  if (t.includes('list topic') || t === 'topics' || t === 'list') return { type: 'list_topics' }
  if (isCancel(t)) return { type: 'cancel' }
  if (isApproveSend(t)) return { type: 'approve_send' }

  const sendNowMatch = raw.match(/^send\s+(?:it\s+)?now(?:\s+(?:on|for|about)\s+(.+))?$/i)
  if (sendNowMatch) return { type: 'send_now', topic: sendNowMatch[1]?.trim() || undefined }

  if (
    /^send\s+(?:the\s+)?(?:last|latest|recent|most recent)\s+(?:one|brief|dossier|email)?$/i.test(raw) ||
    /^send\s+what(?:'s| was| you)?.*(made|created|researched|wasn'?t sent|not sent|built)/i.test(raw)
  ) return { type: 'send_now' }

  const sendTopicMatch = raw.match(/^send\s+(?:the\s+)?(.+?)\s+(?:one|brief|dossier|email|report)(?:\s+now)?$/i)
  if (sendTopicMatch?.[1] && !isApproveSend(t)) return { type: 'send_now', topic: sendTopicMatch[1].trim() }

  const sendBare = raw.match(/^(?:send|email)\s+(.+)$/i)
  if (sendBare?.[1] && !isApproveSend(t)) return { type: 'send_now', topic: sendBare[1].trim() }

  const briefMatch =
    raw.match(/(?:brief|preview|review|show)(?:\s+(?:me|the))?(?:\s+(?:on|for|about))?\s+(.+)/i) ??
    raw.match(/(?:what(?:'s| is) (?:the|our))?\s*(?:brief|intel)(?:\s+(?:on|for|about))?\s+(.+)/i)
  if (briefMatch?.[1]) return { type: 'review', topic: briefMatch[1].trim() }

  const researchMatch = raw.match(
    /(?:research|investigate|analyze|analyse|look into|dig into|explore|study)\s+(.+)/i
  )
  if (researchMatch?.[1]) {
    return { type: 'research', topic: researchMatch[1].trim(), draft_only: t.includes('draft only') }
  }

  if (t.includes('platform') || t.includes('infrastructure')) return { type: 'review', topic: 'platform-infrastructure' }
  if (t.includes('agent') || t.includes('orchestration')) return { type: 'review', topic: 'agent-orchestration' }
  if (t === 'brief' || t === 'preview') return { type: 'review' }

  // Ambiguous — needs Claude
  return null
}

const CLASSIFIER_SYSTEM = `You are the intent classifier for the ACCESS Slack operator bot used by Jerry Devin.

Classify the user's message into one of these intents. Return ONLY valid JSON, no explanation.

Intents:
- "help": wants to know what the bot can do
- "status": wants system status
- "list_topics": wants to see available briefs
- "review": wants to preview an existing brief (extract topic if mentioned)
- "approve_send": wants to send the brief they just reviewed ("yes", "looks good", "go ahead", "fire it", "shoot it", "do it")
- "cancel": wants to cancel or discard ("no", "cancel", "never mind", "stop")
- "send_now": wants to send a brief immediately without review (extract topic if named)
- "research": wants research on a topic and a new brief (extract a clean topic phrase)
- "ignore": message is a URL, a Slack link, emoji-only, or has no actionable request

Rules:
- Questions about markets, stocks, ETFs, business topics → "research" (extract a clean topic)
- Anything that sounds like approval of a pending action → "approve_send"
- If it's a URL (starts with http) → "ignore"
- When topic is needed, rewrite it cleanly (e.g. "PATH ETF and top ETFs for June 2026" not the raw sentence)

Return JSON: {"type": "<intent>", "topic": "<topic string or null>"}`

async function classifyWithClaude(raw: string): Promise<OperatorIntent> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) return { type: 'clarify', raw }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: CLASSIFIER_SYSTEM,
      messages: [{ role: 'user', content: raw }],
    })
    const block = response.content[0]
    if (block.type !== 'text') return { type: 'clarify', raw }

    const parsed = JSON.parse(block.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')) as {
      type: string
      topic?: string | null
    }

    const topic = parsed.topic?.trim() || undefined

    switch (parsed.type) {
      case 'help': return { type: 'help' }
      case 'status': return { type: 'status' }
      case 'list_topics': return { type: 'list_topics' }
      case 'review': return { type: 'review', topic }
      case 'approve_send': return { type: 'approve_send' }
      case 'cancel': return { type: 'cancel' }
      case 'send_now': return { type: 'send_now', topic }
      case 'research': return topic ? { type: 'research', topic } : { type: 'clarify', raw }
      case 'ignore': return { type: 'ignore' }
      default: return { type: 'clarify', raw }
    }
  } catch {
    return { type: 'clarify', raw }
  }
}

export async function parseOperatorIntent(text: string): Promise<OperatorIntent> {
  const raw = text.trim().replace(/<@[A-Z0-9]+>/g, '').trim()

  // Fast path — no API call for clear commands
  const fast = parseOperatorIntentSync(raw)
  if (fast !== null) return fast

  // Natural language path — Claude classifies anything ambiguous
  return classifyWithClaude(raw)
}

export function helpText(): string {
  return HELP_TEXT
}
