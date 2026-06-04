import { getAppBaseUrl, getCompanyMailingAddress } from '@/lib/email/constants'
import { buildUnsubscribeUrl, createUnsubscribeToken } from '@/lib/email/tokens'
import type { MarketingEmailCategory } from '@/lib/email/constants'
import { mdInline } from '@/lib/email/templates/md'

/**
 * Finimize Pulse-grade newsletter shell.
 * Scannable, editorial, written for operators 35-and-under. Leads with value
 * (a signal scoreboard), uses data-viz throughout, never leaks raw markdown.
 */
export const FINIMIZE = {
  bg: '#eef1f6',
  card: '#ffffff',
  ink: '#0b0d12',
  text: '#1a1d26',
  muted: '#697086',
  faint: '#9aa1b2',
  link: '#2f5fff',
  rule: '#2f5fff',
  accentSoft: '#eaf0ff',
  highlight: '#e9f1ff',
  digestBg: '#f4f7ff',
  border: '#e6e9f0',
  up: '#15a35b',
  down: '#e0414a',
  track: '#e9ecf3',
}

export type FinimizeEmailOptions = {
  preheader?: string
  readMinutes?: number
  dateLabel?: string
  heroImageUrl?: string
  bodyHtml: string
  marketing?: { email: string; category: MarketingEmailCategory }
}

function complianceFooter(marketing?: FinimizeEmailOptions['marketing']): string {
  const base = getAppBaseUrl()
  const privacy = `${base}/privacy`
  const terms = `${base}/terms`
  const prefs = `${base}/settings/notifications-email`

  let unsubscribe = ''
  if (marketing?.email) {
    const token =
      createUnsubscribeToken({ email: marketing.email, category: marketing.category }) ||
      createUnsubscribeToken({ email: marketing.email, category: 'all_marketing' })
    const unsubscribeHref = token ? buildUnsubscribeUrl(token) : `${base}/unsubscribe`
    unsubscribe = `<a href="${unsubscribeHref}" style="color:${FINIMIZE.muted};">Unsubscribe</a> · `
  }

  return `
    <tr>
      <td style="padding:24px 28px 30px;border-top:1px solid ${FINIMIZE.border};font-family:system-ui,-apple-system,sans-serif;font-size:12px;line-height:1.7;color:${FINIMIZE.faint};text-align:center;">
        ${unsubscribe}
        <a href="${prefs}" style="color:${FINIMIZE.muted};">Email preferences</a> ·
        <a href="${privacy}" style="color:${FINIMIZE.muted};">Privacy</a> ·
        <a href="${terms}" style="color:${FINIMIZE.muted};">Terms</a><br/>
        <span style="display:block;margin-top:12px;">${getCompanyMailingAddress()}</span>
        <span style="display:block;margin-top:6px;">© ${new Date().getFullYear()} JD AI Systems · ACCESS Intelligence — written for operators</span>
      </td>
    </tr>
  `
}

export function renderFinimizeEmailHtml(options: FinimizeEmailOptions): string {
  const base = getAppBaseUrl()
  const read = options.readMinutes ?? 3
  const date =
    options.dateLabel ??
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const preheader = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${mdInline(options.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : ''

  const hero = options.heroImageUrl
    ? `<tr><td style="padding:0;"><img src="${options.heroImageUrl}" width="600" alt="ACCESS Daily Brief" style="display:block;width:100%;max-width:600px;height:auto;border:0;"/></td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/></head>
<body style="margin:0;padding:0;background:${FINIMIZE.bg};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FINIMIZE.bg};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:600px;background:${FINIMIZE.card};border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(16,24,40,0.06);">
      <tr>
        <td style="padding:18px 28px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${FINIMIZE.faint};">
          <span>${date} · ${read} min read</span>
          <span style="float:right;"><a href="${base}/dashboard" style="color:${FINIMIZE.link};text-decoration:none;">Open in browser →</a></span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 28px 18px;border-bottom:3px solid ${FINIMIZE.ink};">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;letter-spacing:-0.02em;color:${FINIMIZE.ink};line-height:1.05;">THE DAILY BRIEF</p>
          <p style="margin:6px 0 0;font-family:system-ui,sans-serif;font-size:12px;letter-spacing:0.02em;color:${FINIMIZE.muted};">Filed by <strong style="color:${FINIMIZE.text};">ACCESS Intelligence</strong> — the signal under the noise, for operators.</p>
        </td>
      </tr>
      ${hero}
      <tr>
        <td style="padding:22px 28px 8px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:16px;line-height:1.62;color:${FINIMIZE.text};">
          ${options.bodyHtml}
        </td>
      </tr>
      ${complianceFooter(options.marketing)}
    </table>
    <p style="max-width:600px;margin:14px auto 0;font-family:system-ui,sans-serif;font-size:11px;color:${FINIMIZE.faint};text-align:center;">You're reading the operator edition. Forward it to someone building something.</p>
  </td></tr>
</table>
</body></html>`
}

/* ── Section primitives ────────────────────────────────────────────── */

export function finimizeSectionLabel(emoji: string, label: string): string {
  return `<p style="margin:26px 0 12px;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${FINIMIZE.link};">${emoji ? emoji + ' ' : ''}${label}</p>`
}

/** The cold-open lede — a journalist's first line, set large. */
export function finimizeLede(text: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;">
      <tr>
        <td style="padding:2px 0 2px 16px;border-left:4px solid ${FINIMIZE.rule};">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.32;font-weight:600;color:${FINIMIZE.ink};">${mdInline(text)}</p>
        </td>
      </tr>
    </table>`
}

export function finimizeQuestionBlock(title: string, bodyHtml: string): string {
  return `
    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:${FINIMIZE.ink};">${title}</p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.66;color:${FINIMIZE.text};">${bodyHtml}</p>
  `
}

export function finimizeBullet(icon: string, html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;"><tr>
    <td width="24" valign="top" style="font-size:15px;line-height:1.6;">${icon}</td>
    <td valign="top" style="font-size:15px;line-height:1.62;color:${FINIMIZE.text};">${html}</td>
  </tr></table>`
}

export function finimizeDigestRow(emoji: string, title: string, summaryHtml: string, href?: string): string {
  const headline = href
    ? `<a href="${href}" style="color:${FINIMIZE.link};font-weight:700;text-decoration:none;">${mdInline(title)}</a>`
    : `<strong style="color:${FINIMIZE.ink};">${mdInline(title)}</strong>`
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;"><tr>
    <td width="26" valign="top" style="font-size:16px;">${emoji}</td>
    <td valign="top" style="font-size:15px;line-height:1.5;">
      ${headline}<br/>
      <span style="color:${FINIMIZE.muted};font-size:14px;">${summaryHtml}</span>
    </td>
  </tr></table>`
}

/** Left-bordered pull quote — used for what operators are actually saying. */
export function finimizePullQuote(text: string, attribution?: string): string {
  const clean = text.replace(/^"|"$/g, '')
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
      <tr>
        <td style="padding:12px 16px;background:${FINIMIZE.digestBg};border-left:3px solid ${FINIMIZE.rule};border-radius:0 8px 8px 0;">
          <p style="margin:0;font-size:15px;line-height:1.55;font-style:italic;color:${FINIMIZE.ink};">"${mdInline(clean)}"</p>
          ${attribution ? `<p style="margin:6px 0 0;font-size:12px;color:${FINIMIZE.muted};">— ${mdInline(attribution)}</p>` : ''}
        </td>
      </tr>
    </table>`
}

/* ── Data-viz: scoreboard + bars (email-safe, no SVG) ─────────────── */

export type ScoreMetric = {
  label: string
  value: string
  /** 0–100 to draw a bar; omit for value-only cells */
  pct?: number
  tone?: 'up' | 'down' | 'neutral'
}

function barColor(tone?: ScoreMetric['tone']): string {
  if (tone === 'up') return FINIMIZE.up
  if (tone === 'down') return FINIMIZE.down
  return FINIMIZE.link
}

function finimizeBar(pct: number, tone?: ScoreMetric['tone']): string {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)))
  const color = barColor(tone)
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:7px 0 0;border-radius:6px;overflow:hidden;background:${FINIMIZE.track};"><tr>
    <td style="height:7px;line-height:7px;font-size:0;background:${color};width:${clamped}%;">&nbsp;</td>
    <td style="height:7px;line-height:7px;font-size:0;width:${100 - clamped}%;">&nbsp;</td>
  </tr></table>`
}

function scoreCell(m: ScoreMetric): string {
  const valColor = m.tone === 'up' ? FINIMIZE.up : m.tone === 'down' ? FINIMIZE.down : FINIMIZE.ink
  return `
    <td width="50%" valign="top" style="padding:10px 12px;">
      <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${FINIMIZE.faint};">${m.label}</p>
      <p style="margin:3px 0 0;font-size:19px;font-weight:800;color:${valColor};line-height:1.1;">${mdInline(m.value)}</p>
      ${typeof m.pct === 'number' ? finimizeBar(m.pct, m.tone) : ''}
    </td>`
}

/** Finimize-style "what's going on" scoreboard. Renders metrics two per row. */
export function finimizeScoreboard(label: string, note: string, metrics: ScoreMetric[]): string {
  if (!metrics.length) return ''
  const rows: string[] = []
  for (let i = 0; i < metrics.length; i += 2) {
    const left = scoreCell(metrics[i])
    const right = metrics[i + 1]
      ? scoreCell(metrics[i + 1])
      : `<td width="50%">&nbsp;</td>`
    rows.push(`<tr>${left}${right}</tr>`)
  }
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:2px 0 8px;background:${FINIMIZE.card};border:1px solid ${FINIMIZE.border};border-radius:12px;overflow:hidden;">
      <tr><td style="padding:12px 14px 2px;">
        ${finimizeSectionLabel('👀', label)}
        ${note ? `<p style="margin:-6px 0 2px;font-size:13px;color:${FINIMIZE.muted};">${mdInline(note)}</p>` : ''}
      </td></tr>
      <tr><td style="padding:0 2px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join('')}</table>
      </td></tr>
    </table>`
}

/* ── Real rendered charts (hosted PNG via QuickChart — renders in Gmail/Apple Mail) ── */

export type ChartSpecInput = {
  title?: string
  type?: 'bar' | 'line'
  labels: string[]
  series: { label?: string; data: number[]; color?: string }[]
  unit?: string
  caption?: string
}

const CHART_PALETTE = ['#2f5fff', '#15a35b', '#9aa1b2', '#e0414a']

/** Build a hosted chart image URL (no infra needed). Returns '' if the spec is empty. */
export function quickChartUrl(spec: ChartSpecInput, opts?: { w?: number; h?: number }): string {
  if (!spec?.labels?.length || !spec?.series?.length) return ''
  const config = {
    type: spec.type ?? 'bar',
    data: {
      labels: spec.labels,
      datasets: spec.series.map((s, i) => ({
        label: s.label ?? '',
        data: s.data,
        backgroundColor: s.color ?? CHART_PALETTE[i % CHART_PALETTE.length],
        borderColor: s.color ?? CHART_PALETTE[i % CHART_PALETTE.length],
        borderWidth: spec.type === 'line' ? 3 : 0,
        fill: false,
        tension: 0.3,
        borderRadius: 6,
      })),
    },
    options: {
      plugins: {
        legend: { display: spec.series.length > 1, labels: { font: { size: 12 } } },
        datalabels: {
          display: true,
          anchor: 'end',
          align: 'end',
          color: '#0b0d12',
          font: { weight: 'bold', size: 12 },
          formatter: (v: number) => `${spec.unit ?? ''}${v}`,
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 12 } } },
        y: { grid: { color: '#eef1f6' }, ticks: { font: { size: 11 } }, beginAtZero: true },
      },
    },
  }
  const w = opts?.w ?? 560
  const h = opts?.h ?? 300
  return `https://quickchart.io/chart?w=${w}&h=${h}&bkg=white&devicePixelRatio=2&c=${encodeURIComponent(
    JSON.stringify(config)
  )}`
}

/** A rendered chart image block with a section label + caption. */
export function finimizeChartImage(spec: ChartSpecInput): string {
  const url = quickChartUrl(spec)
  if (!url) return ''
  return `
    <div style="margin:24px 0;padding-top:8px;border-top:1px solid ${FINIMIZE.border};">
      ${spec.title ? finimizeSectionLabel('📊', spec.title) : ''}
      <img src="${url}" alt="${spec.title ?? 'Chart'}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;border-radius:10px;"/>
      ${spec.caption ? `<p style="margin:8px 0 0;font-size:12px;color:${FINIMIZE.faint};">${mdInline(spec.caption)}</p>` : ''}
    </div>`
}

/** A scoreboard-style hero image (hosted), used at the very top for instant value. */
export function finimizeHeroChartUrl(spec: ChartSpecInput): string {
  return quickChartUrl(spec, { w: 600, h: 280 })
}

/** Horizontal labeled bars — the "chart of the day" built in pure HTML. */
export function finimizeBarChart(
  title: string,
  caption: string,
  bars: { label: string; pct: number; value?: string }[]
): string {
  if (!bars.length) return ''
  const rows = bars
    .map(
      (b) => `
      <tr>
        <td style="padding:6px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:13px;color:${FINIMIZE.text};font-weight:600;">${mdInline(b.label)}</td>
            <td align="right" style="font-size:12px;color:${FINIMIZE.muted};font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;">${b.value ?? `${Math.round(b.pct)}`}</td>
          </tr></table>
          ${finimizeBar(b.pct)}
        </td>
      </tr>`
    )
    .join('')
  return `
    <div style="margin:24px 0;padding-top:8px;border-top:1px solid ${FINIMIZE.border};">
      ${finimizeSectionLabel('📊', title)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      ${caption ? `<p style="margin:8px 0 0;font-size:12px;color:${FINIMIZE.faint};">${mdInline(caption)}</p>` : ''}
    </div>`
}
