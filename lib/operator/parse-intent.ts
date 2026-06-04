export type OperatorIntent =
  | { type: 'help' }
  | { type: 'status' }
  | { type: 'list_topics' }
  | { type: 'review'; topic?: string }
  | { type: 'approve_send' }
  | { type: 'cancel' }
  | { type: 'send_now'; topic?: string }
  | { type: 'research'; topic: string; draft_only?: boolean }
  | { type: 'clarify'; raw: string }

const HELP_TEXT = `*ACCESS Intelligence — Slack Operator*

Everything happens here. No files to open on your Mac.

*Research any topic:*
• \`research the creator economy in 2026\`
• \`research [anything you care about]\`
→ I research, post a preview here, then you reply *send it*.

*Review an existing brief:*
• \`brief on platform infrastructure\`

*Approve & email:* reply *send it* (or *sent it*, *ship it*, *go*)
*Skip review:* \`send it now on [topic]\`
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
  // "yes"/"yeah"/"ok" alone = affirmative (handler checks pending review)
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

export function parseOperatorIntent(text: string): OperatorIntent {
  const raw = text.trim().replace(/<@[A-Z0-9]+>/g, '').trim()
  const t = raw.toLowerCase()

  if (!t || t === 'help' || t === '?' || t === 'commands') return { type: 'help' }
  if (t === 'status') return { type: 'status' }
  if (t.includes('list topic') || t === 'topics' || t === 'list') return { type: 'list_topics' }

  if (isCancel(t)) return { type: 'cancel' }

  // "send it now [on topic]" — explicit skip-review send
  const sendNowMatch = raw.match(/^send\s+(?:it\s+)?now(?:\s+(?:on|for|about)\s+(.+))?$/i)
  if (sendNowMatch) {
    return { type: 'send_now', topic: sendNowMatch[1]?.trim() || undefined }
  }

  // "send the last one" / "send what you just made" / "send what wasn't sent" → latest dossier
  if (
    /^send\s+(?:the\s+)?(?:last|latest|recent|most recent)\s+(?:one|brief|dossier|email)?$/i.test(raw) ||
    /^send\s+what(?:'s| was| you)?.*(made|created|researched|wasn'?t sent|not sent|built)/i.test(raw)
  ) {
    return { type: 'send_now' }
  }

  // "send the openai one" / "send the openai brief" / "send openai" → that topic, skip review
  const sendTopicMatch = raw.match(
    /^send\s+(?:the\s+)?(.+?)\s+(?:one|brief|dossier|email|report)$/i
  )
  if (sendTopicMatch?.[1] && !isApproveSend(t)) {
    return { type: 'send_now', topic: sendTopicMatch[1].trim() }
  }

  // Approve the pending review
  if (isApproveSend(t)) return { type: 'approve_send' }

  // "send [topic]" where topic is a real word (not an approve keyword)
  const sendBare = raw.match(/^(?:send|email)\s+(.+)$/i)
  if (sendBare?.[1] && !isApproveSend(t)) {
    return { type: 'send_now', topic: sendBare[1].trim() }
  }

  // Explicit review of an existing brief
  const briefMatch =
    raw.match(/(?:brief|preview|review|show)(?:\s+(?:me|the))?(?:\s+(?:on|for|about))?\s+(.+)/i) ??
    raw.match(/(?:what(?:'s| is) (?:the|our))?\s*(?:brief|intel)(?:\s+(?:on|for|about))?\s+(.+)/i)
  if (briefMatch?.[1]) {
    return { type: 'review', topic: briefMatch[1].trim() }
  }

  // Explicit research — the ONLY path that launches a research run
  const researchMatch = raw.match(
    /(?:research|investigate|analyze|analyse|look into|dig into|explore|study)\s+(.+)/i
  )
  if (researchMatch?.[1]) {
    const draftOnly = t.includes('draft only') || t.includes('no send')
    return { type: 'research', topic: researchMatch[1].trim(), draft_only: draftOnly }
  }

  // Known topic shortcuts → review existing
  if (t.includes('platform') || t.includes('infrastructure')) {
    return { type: 'review', topic: 'platform-infrastructure' }
  }
  if (t.includes('agent') || t.includes('orchestration')) {
    return { type: 'review', topic: 'agent-orchestration' }
  }

  if (t === 'brief' || t === 'preview') return { type: 'review' }

  // SAFETY: never auto-launch research on ambiguous text — confirm first.
  return { type: 'clarify', raw }
}

export function helpText(): string {
  return HELP_TEXT
}
