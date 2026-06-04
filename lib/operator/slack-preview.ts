import type { DossierPreview } from '@/lib/operator/load-brief-preview'

function trunc(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

/** Finimize-style brief formatted for Slack — readable on mobile, no files needed. */
export function formatSlackBriefPreview(p: DossierPreview): string {
  const lead = p.headlines[0]?.title ?? p.hook ?? p.topic
  const signalLine = p.signal_score != null ? ` · Signal *${p.signal_score}/100*` : ''

  const sections: string[] = [
    `👀 *TODAY'S BRIEF PREVIEW*${signalLine}`,
    '',
    `*${lead}*`,
    '',
    '*What\u2019s going on here?*',
    trunc(p.signal_summary || p.headlines[0]?.explainer || p.intelligence_summary, 900),
    '',
    '*What does this mean?*',
    trunc(p.intelligence_summary, 1200),
  ]

  if (p.key_takeaways.length) {
    sections.push('', p.key_takeaways.slice(0, 4).map((t) => `▶️ ${trunc(t, 280)}`).join('\n'))
  }

  sections.push(
    '',
    '*Why should I care?*',
    trunc(p.recommended_action, 600),
  )

  if (p.product_context) {
    sections.push('', `*For you personally:* ${trunc(p.product_context, 400)}`)
  }

  if (p.headlines.length > 1) {
    sections.push('', `✨ *ALSO ON YOUR RADAR*`)
    for (const h of p.headlines.slice(1, 4)) {
      sections.push(`• *${trunc(h.title, 80)}* — ${trunc(h.explainer ?? '', 120)}`)
    }
  }

  sections.push(
    '',
    '—',
    'Reply *send it* to email this brief to you',
    'Reply *revise* with feedback · *cancel* to discard',
  )

  return sections.join('\n')
}

/** Split long Slack messages (4000 char limit). */
export function splitSlackMessage(text: string, max = 3900): string[] {
  if (text.length <= max) return [text]
  const chunks: string[] = []
  let rest = text
  while (rest.length > max) {
    let cut = rest.lastIndexOf('\n', max)
    if (cut < max * 0.5) cut = max
    chunks.push(rest.slice(0, cut))
    rest = rest.slice(cut).trimStart()
  }
  if (rest) chunks.push(rest)
  return chunks
}
