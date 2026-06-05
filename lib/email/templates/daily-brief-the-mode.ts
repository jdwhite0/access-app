import { getAppBaseUrl } from '@/lib/email/constants'
import {
  renderTheModeEmailHtml,
  resolveCollaboratingVenture,
  modeLabel,
  modeLede,
  modeBullet,
  modeDigestRow,
  modePullQuote,
  modeScoreboard,
  modeBarChart,
  THE_MODE,
  type ModeMetric,
} from '@/lib/email/templates/layout-the-mode'
import { mdInline, mdBlock, cleanText, dedupeStrings, isContainedIn } from '@/lib/email/templates/md'
import type { HeadlineInput, VisualIdeaInput } from '@/lib/email/templates/blocks/intelligence-blocks'
import type { ChartSpecInput } from '@/lib/email/templates/layout-finimize'
import { finimizeHeroChartUrl, finimizeChartImage } from '@/lib/email/templates/layout-finimize'

/**
 * THE MODE — daily brief email.
 *
 * Brand home: JD Productions (media division).
 * Current use: founder-level daily brief for testing brand + pipeline.
 * Future use: subscribers who sign up through THE MODE podcast brand.
 *   → Those subscribers are NOT all ACCESS users — they are a distinct
 *     audience who discover THE MODE as a podcast/newsletter and opt in.
 *   → At scale: route by subscriber_source === 'the_mode_podcast'.
 */

const DIGEST_LABELS = ['01', '02', '03', '04']
const WHY_ICONS = ['›', '›', '›', '›']

export function theModeFeedbackBlock(dossierId: string, email: string): string {
  const base = getAppBaseUrl()
  const q = (rating: string) =>
    `${base}/api/email/feedback?dossier=${encodeURIComponent(dossierId)}&email=${encodeURIComponent(email)}&rating=${rating}`
  const btn = (href: string, label: string) =>
    `<a href="${href}" style="display:inline-block;padding:10px 18px;background:${THE_MODE.accentSoft};border-radius:8px;font-size:13px;font-weight:700;color:${THE_MODE.accentDeep};text-decoration:none;margin:4px;">${label}</a>`
  return `
    <div style="margin:30px 0 0;padding-top:22px;border-top:1px solid ${THE_MODE.border};">
      ${modeLabel('Was this your mode?')}
      <div style="text-align:left;">
        ${btn(q('hot'), 'Sharp — send more')}
        ${btn(q('alright'), 'Good, keep going')}
        ${btn(q('meh'), 'Miss — recalibrate')}
      </div>
    </div>
  `
}

export function renderDailyBriefTheModeEmail(input: {
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
  const leadTitle = cleanText(lead?.title ?? input.topic ?? "Today's signal")
  const category = input.market_signal?.category || 'Intelligence'

  const ledeText = cleanText(input.hook || input.productTip || '') || leadTitle

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

  // ── Signal board (scoreboard) ──
  const metrics: ModeMetric[] = []
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
  const scoreNote = input.timing_rationale
    ? cleanText(input.timing_rationale)
    : input.market_signal?.summary
      ? cleanText(input.market_signal.summary)
      : ''
  const scoreboardHtml = modeScoreboard('Signal board', scoreNote, metrics)

  // ── Bar chart ──
  const chartBars: { label: string; pct: number; value?: string }[] = []
  if (typeof input.signal_score === 'number')
    chartBars.push({ label: 'Signal strength', pct: input.signal_score, value: `${input.signal_score}` })
  if (typeof input.confidence_score === 'number')
    chartBars.push({ label: 'Confidence', pct: input.confidence_score, value: `${input.confidence_score}%` })
  if (typeof input.verified_sources_count === 'number' && (input.sources_count ?? 0) > 0) {
    const pct = Math.round((input.verified_sources_count / (input.sources_count as number)) * 100)
    chartBars.push({ label: 'Evidence verified', pct, value: `${pct}%` })
  }
  const barChartHtml =
    chartBars.length >= 2
      ? modeBarChart('Signal breakdown', 'How strong this read is, and how much to act on it.', chartBars)
      : ''

  // ── Why it matters ──
  const whyHtml = whyBullets.length
    ? modeLabel('Why this matters') +
      whyBullets
        .slice(0, 3)
        .map((t, i) => modeBullet(WHY_ICONS[i] ?? '›', mdInline(t)))
        .join('')
    : ''

  // ── Your move (operator read) ──
  const operatorHtml = operatorRead
    ? modeLabel('Your move') +
      `<p style="margin:0 0 18px;font-size:16px;line-height:1.66;color:${THE_MODE.text};">${mdBlock(operatorRead)}</p>`
    : ''

  // ── What they're saying ──
  const quotes = dedupeStrings(input.pain_points ?? []).slice(0, 3)
  const quotesHtml = quotes.length
    ? modeLabel("What they're saying") + quotes.map((q) => modePullQuote(q)).join('')
    : ''

  // ── The briefing (remaining headlines) ──
  const digestHeadlines = (input.headlines ?? []).slice(1, 5)
  const digestHtml = digestHeadlines.length
    ? `<div style="margin:18px 0;padding:16px 18px;background:${THE_MODE.digestBg};border-radius:12px;border:1px solid ${THE_MODE.border};">
        ${modeLabel('The briefing')}
        <p style="margin:-4px 0 12px;font-size:13px;color:${THE_MODE.muted};">More moves worth your attention.</p>
        ${digestHeadlines
          .map((h, i) =>
            modeDigestRow(
              DIGEST_LABELS[i % DIGEST_LABELS.length],
              h.title,
              mdInline(h.explainer ?? ''),
              h.source_url
            )
          )
          .join('')}
      </div>`
    : ''

  // ── The MODE move ──
  const moveHtml = input.recommendedAction
    ? modeLabel('The MODE move') +
      `<p style="margin:0 0 6px;font-size:16px;line-height:1.6;color:${THE_MODE.text};"><strong style="color:${THE_MODE.ink};">${mdInline(cleanText(input.recommendedAction))}</strong></p>`
    : ''

  // ── Dig deeper callout ──
  const chart = input.visual_ideas?.find((v) => v.description)
  const deeperHtml = chart?.description
    ? `<div style="margin:22px 0 0;padding:14px 16px;border:1px dashed ${THE_MODE.border};border-radius:12px;">
        ${modeLabel('Go deeper')}
        <p style="margin:-4px 0 4px;font-size:15px;font-weight:700;color:${THE_MODE.ink};">${mdInline(cleanText(chart.description))}</p>
        <p style="margin:0;font-size:13px;"><a href="${getAppBaseUrl()}/dashboard" style="color:${THE_MODE.accent};text-decoration:none;font-weight:600;">Open in ACCESS →</a></p>
      </div>`
    : ''

  // ── Rendered charts ──
  const charts = (input.charts ?? []).filter((c) => c?.labels?.length && c?.series?.length)
  const heroChartUrl = charts[0] ? finimizeHeroChartUrl(charts[0]) : ''
  const inlineChartsHtml = charts
    .slice(heroChartUrl ? 1 : 0)
    .map((c) => finimizeChartImage(c))
    .join('')

  const bodyHtml = `
    ${scoreboardHtml}
    ${modeLede(ledeText)}
    ${modeLabel('The read')}
    <p style="margin:0 0 4px;font-size:19px;font-weight:800;line-height:1.3;color:${THE_MODE.ink};">${mdInline(leadTitle)}</p>
    ${lead?.explainer ? `<p style="margin:0 0 12px;font-size:14px;font-style:italic;color:${THE_MODE.muted};">${mdInline(lead.explainer)}</p>` : ''}
    <p style="margin:0 0 20px;font-size:16px;line-height:1.66;color:${THE_MODE.text};">${mdBlock(read)}</p>
    ${whyHtml}
    ${operatorHtml}
    ${inlineChartsHtml}
    ${barChartHtml}
    ${quotesHtml}
    ${digestHtml}
    ${moveHtml}
    ${deeperHtml}
    <div style="margin:32px 0 0;padding-top:20px;border-top:2px solid ${THE_MODE.masthead};">
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:${THE_MODE.ink};">That's THE MODE.<br/><span style="font-style:italic;color:${THE_MODE.muted};">Stay in it, ${input.handle}.</span></p>
    </div>
    ${input.feedback_enabled !== false && input.dossier_id ? theModeFeedbackBlock(input.dossier_id, input.email) : ''}
  `

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  const subjectHook = (input.hook ? cleanText(input.hook) : leadTitle).slice(0, 60)

  const words = (read + ' ' + whyBullets.join(' ') + ' ' + operatorRead).split(/\s+/).length
  const readMinutes = Math.max(2, Math.min(6, Math.round(words / 200) + 1))

  const collaboratingVenture = resolveCollaboratingVenture(
    input.market_signal?.category,
    input.topic
  )

  return {
    subject: input.subject_line ?? `THE MODE · ${subjectHook}`,
    html: renderTheModeEmailHtml({
      preheader: cleanText(input.hook || input.recommendedAction || '').slice(0, 140),
      readMinutes,
      dateLabel,
      heroImageUrl: heroChartUrl || undefined,
      collaboratingVenture,
      bodyHtml,
      marketing: { email: input.email, category: 'daily_brief' },
    }),
  }
}
