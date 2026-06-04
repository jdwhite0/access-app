import { getAppBaseUrl } from '@/lib/email/constants'
import {
  renderFinimizeEmailHtml,
  finimizeSectionLabel,
  finimizeQuestionBlock,
  finimizeLede,
  finimizeBullet,
  finimizeDigestRow,
  finimizePullQuote,
  finimizeScoreboard,
  finimizeBarChart,
  finimizeChartImage,
  finimizeHeroChartUrl,
  type ScoreMetric,
  type ChartSpecInput,
  FINIMIZE,
} from '@/lib/email/templates/layout-finimize'
import { mdInline, mdBlock, cleanText, dedupeStrings, isContainedIn } from '@/lib/email/templates/md'
import type { HeadlineInput, VisualIdeaInput } from '@/lib/email/templates/blocks/intelligence-blocks'

const DIGEST_EMOJIS = ['🚀', '📡', '🧾', '🌐', '⚡', '🔧']
const WHY_ICONS = ['▶️', '🔸', '🔹', '◽']

export function finimizeFeedbackBlock(dossierId: string, email: string): string {
  const base = getAppBaseUrl()
  const q = (rating: string) =>
    `${base}/api/email/feedback?dossier=${encodeURIComponent(dossierId)}&email=${encodeURIComponent(email)}&rating=${rating}`
  const btn = (href: string, label: string) =>
    `<a href="${href}" style="display:block;padding:12px 8px;background:${FINIMIZE.digestBg};border-radius:10px;text-align:center;font-size:13px;font-weight:700;color:${FINIMIZE.ink};text-decoration:none;">${label}</a>`
  return `
    <div style="margin:30px 0 0;padding-top:22px;border-top:1px solid ${FINIMIZE.border};">
      ${finimizeSectionLabel('💬', 'Was this worth your inbox?')}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="33%" style="padding:4px;">${btn(q('hot'), '🔥 Sharp')}</td>
        <td width="33%" style="padding:4px;">${btn(q('alright'), '👍 Fine')}</td>
        <td width="33%" style="padding:4px;">${btn(q('meh'), '😴 Skip it')}</td>
      </tr></table>
    </div>
  `
}

export function renderDailyBriefFinimizeEmail(input: {
  email: string
  handle: string
  subject_line?: string
  dossier_id?: string
  topic?: string
  market_signal?: { category?: string; summary?: string }
  hook?: string
  signal_score?: number
  confidence_score?: number
  timing_rationale?: string
  verified_sources_count?: number
  sources_count?: number
  sources?: { label?: string; url?: string; verified?: boolean }[]
  pain_points?: string[]
  intelligence: string
  headlines?: HeadlineInput[]
  key_takeaways?: string[]
  recommendedAction: string
  productTip?: string
  positioning_read?: string
  visual_ideas?: VisualIdeaInput[]
  charts?: ChartSpecInput[]
  feedback_enabled?: boolean
}): { subject: string; html: string } {
  const lead = input.headlines?.[0]
  const leadTitle = cleanText(lead?.title ?? input.topic ?? 'Today’s signal')
  const category = input.market_signal?.category || 'Intelligence'

  // ── Cold-open lede: the hook a journalist would lead with ──
  const ledeText = cleanText(input.hook || input.productTip || '') || leadTitle

  // ── The story: deduped against everything that follows ──
  const read = cleanText(input.intelligence)
  const usedForCompare: string[] = [read]

  let operatorRead =
    input.positioning_read && !isContainedIn(input.positioning_read, usedForCompare)
      ? cleanText(input.positioning_read)
      : ''
  if (operatorRead) usedForCompare.push(operatorRead)

  let whyBullets = dedupeStrings(input.key_takeaways ?? []).filter(
    (t) => !isContainedIn(t, usedForCompare)
  )
  if (!operatorRead && whyBullets.length) {
    operatorRead = whyBullets.shift() as string
    usedForCompare.push(operatorRead)
  }

  // ── Scoreboard metrics (immediate value, real numbers only) ──
  const metrics: ScoreMetric[] = []
  if (typeof input.signal_score === 'number') {
    metrics.push({
      label: 'Signal strength',
      value: `${input.signal_score}/100`,
      pct: input.signal_score,
      tone: input.signal_score >= 70 ? 'up' : 'neutral',
    })
  }
  if (typeof input.confidence_score === 'number') {
    metrics.push({
      label: 'Confidence',
      value: `${input.confidence_score}%`,
      pct: input.confidence_score,
      tone: input.confidence_score >= 70 ? 'up' : 'neutral',
    })
  }
  metrics.push({ label: 'Category', value: category })
  if (typeof input.verified_sources_count === 'number' && input.verified_sources_count > 0) {
    const total = input.sources_count || input.verified_sources_count
    metrics.push({ label: 'Verified sources', value: `${input.verified_sources_count}/${total}` })
  }
  const scoreboardNote = input.timing_rationale
    ? `Why now — ${cleanText(input.timing_rationale)}`
    : input.market_signal?.summary
      ? cleanText(input.market_signal.summary)
      : ''
  const scoreboardHtml = finimizeScoreboard("Today's signal", scoreboardNote, metrics)

  // ── Honest bar chart (no invented data) ──
  const chartBars: { label: string; pct: number; value?: string }[] = []
  if (typeof input.signal_score === 'number')
    chartBars.push({ label: 'Signal strength', pct: input.signal_score, value: `${input.signal_score}` })
  if (typeof input.confidence_score === 'number')
    chartBars.push({ label: 'Distribution confidence', pct: input.confidence_score, value: `${input.confidence_score}%` })
  if (typeof input.verified_sources_count === 'number' && (input.sources_count ?? 0) > 0) {
    const pct = Math.round((input.verified_sources_count / (input.sources_count as number)) * 100)
    chartBars.push({ label: 'Evidence verified', pct, value: `${pct}%` })
  }
  const barChartHtml =
    chartBars.length >= 2
      ? finimizeBarChart(
          'Signal breakdown',
          'How strong this read is, and how much we’d stake on it.',
          chartBars
        )
      : ''

  // ── Why it matters bullets ──
  const whyHtml = whyBullets.length
    ? finimizeSectionLabel('⚡', 'Why it matters') +
      whyBullets
        .slice(0, 3)
        .map((t, i) => finimizeBullet(WHY_ICONS[i] ?? '•', mdInline(t)))
        .join('')
    : ''

  // ── Operator's read ──
  const operatorHtml = operatorRead
    ? finimizeSectionLabel('🎯', "The operator's read") +
      `<p style="margin:0 0 18px;font-size:16px;line-height:1.66;color:${FINIMIZE.text};">${mdBlock(operatorRead)}</p>`
    : ''

  // ── What operators are saying (pull quotes) ──
  const quotes = dedupeStrings(input.pain_points ?? []).slice(0, 3)
  const quotesHtml = quotes.length
    ? finimizeSectionLabel('💬', 'What operators are saying') +
      quotes.map((q) => finimizePullQuote(q)).join('')
    : ''

  // ── The briefing (remaining headlines) ──
  const digestHeadlines = (input.headlines ?? []).slice(1, 5)
  const digestHtml = digestHeadlines.length
    ? `<div style="margin:18px 0;padding:16px 18px;background:${FINIMIZE.digestBg};border-radius:12px;">
        ${finimizeSectionLabel('🗞️', 'The briefing')}
        <p style="margin:-6px 0 12px;font-size:13px;color:${FINIMIZE.muted};">Three more moves worth a glance.</p>
        ${digestHeadlines
          .map((h, i) =>
            finimizeDigestRow(
              DIGEST_EMOJIS[i % DIGEST_EMOJIS.length],
              h.title,
              mdInline(h.explainer ?? ''),
              h.source_url
            )
          )
          .join('')}
      </div>`
    : ''

  // ── The move (clear next step) ──
  const moveHtml = input.recommendedAction
    ? finimizeSectionLabel('✅', 'The move') +
      `<p style="margin:0 0 6px;font-size:16px;line-height:1.6;color:${FINIMIZE.text};"><strong style="color:${FINIMIZE.ink};">${mdInline(cleanText(input.recommendedAction))}</strong></p>`
    : ''

  // ── Chart-of-the-day callout (links into ACCESS) ──
  const chart = input.visual_ideas?.find((v) => v.description)
  const chartCalloutHtml = chart?.description
    ? `<div style="margin:22px 0 0;padding:14px 16px;border:1px dashed ${FINIMIZE.border};border-radius:12px;">
        ${finimizeSectionLabel('📈', 'Dig deeper in ACCESS')}
        <p style="margin:-6px 0 4px;font-size:15px;font-weight:700;color:${FINIMIZE.ink};">${mdInline(cleanText(chart.description))}</p>
        <p style="margin:0;font-size:13px;"><a href="${getAppBaseUrl()}/dashboard" style="color:${FINIMIZE.link};text-decoration:none;font-weight:600;">Open the full read →</a></p>
      </div>`
    : ''

  // ── Real rendered charts (hosted images). First becomes the hero; rest go inline. ──
  const charts = (input.charts ?? []).filter((c) => c?.labels?.length && c?.series?.length)
  const heroChartUrl = charts[0] ? finimizeHeroChartUrl(charts[0]) : ''
  const inlineChartsHtml = charts
    .slice(heroChartUrl ? 1 : 0)
    .map((c) => finimizeChartImage(c))
    .join('')

  const bodyHtml = `
    ${scoreboardHtml}
    ${finimizeLede(ledeText)}
    ${finimizeSectionLabel('🧭', 'The story')}
    <p style="margin:0 0 4px;font-size:19px;font-weight:800;line-height:1.3;color:${FINIMIZE.ink};">${mdInline(leadTitle)}</p>
    ${lead?.explainer ? `<p style="margin:0 0 12px;font-size:14px;font-style:italic;color:${FINIMIZE.muted};">${mdInline(lead.explainer)}</p>` : ''}
    <p style="margin:0 0 20px;font-size:16px;line-height:1.66;color:${FINIMIZE.text};">${mdBlock(read)}</p>
    ${whyHtml}
    ${operatorHtml}
    ${inlineChartsHtml}
    ${barChartHtml}
    ${quotesHtml}
    ${digestHtml}
    ${moveHtml}
    ${chartCalloutHtml}
    <p style="margin:28px 0 0;font-size:14px;color:${FINIMIZE.muted};">That's the read.<br/><strong style="color:${FINIMIZE.ink};">ACCESS Intelligence</strong> — filed for ${input.handle}.</p>
    ${input.feedback_enabled !== false && input.dossier_id ? finimizeFeedbackBlock(input.dossier_id, input.email) : ''}
  `

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const subjectHook = (input.hook ? cleanText(input.hook) : leadTitle).slice(0, 64)

  // crude read-time estimate
  const words = (read + ' ' + whyBullets.join(' ') + ' ' + operatorRead).split(/\s+/).length
  const readMinutes = Math.max(2, Math.min(6, Math.round(words / 200) + 1))

  return {
    subject: input.subject_line ?? `${subjectHook} · ${dateLabel}`,
    html: renderFinimizeEmailHtml({
      preheader: cleanText(input.hook || input.recommendedAction || '').slice(0, 140),
      readMinutes,
      dateLabel,
      heroImageUrl: heroChartUrl || undefined,
      bodyHtml,
      marketing: { email: input.email, category: 'daily_brief' },
    }),
  }
}
