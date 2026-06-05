import { getAppBaseUrl, getCompanyMailingAddress } from '@/lib/email/constants'
import { buildUnsubscribeUrl, createUnsubscribeToken } from '@/lib/email/tokens'
import type { MarketingEmailCategory } from '@/lib/email/constants'
import { mdInline } from '@/lib/email/templates/md'

/**
 * THE MODE — editorial newsletter shell.
 * Under JD Productions (media division). Lives as:
 *   founder-level daily brief now → newsletter + podcast brand at scale.
 *
 * Future subscribers: only users who sign up through THE MODE podcast/brand
 * (not all ACCESS users). Infrastructure is ready — routing TBD at launch.
 *
 * Brand color: teal (#1aabbd) — from the original Mode proposal (2023).
 * Voice: editorial, operator-facing, podcast-ready language throughout.
 */
export const THE_MODE = {
  bg: '#f0f2f5',
  card: '#ffffff',
  masthead: '#0d1117',
  mastheadText: '#ffffff',
  mastheadSub: '#1aabbd',
  ink: '#0d1117',
  text: '#1e2430',
  muted: '#6b7480',
  faint: '#9aa1b0',
  accent: '#1aabbd',
  accentDeep: '#0e7c8a',
  accentSoft: '#e8f8fa',
  rule: '#1aabbd',
  border: '#e2e6ec',
  digestBg: '#f5f9fa',
  up: '#0f9e5e',
  down: '#e03050',
  track: '#e8edf4',
}

/**
 * THE MODE collaborative publication architecture.
 *
 * THE MODE = publisher (distribution + brand)
 * Venture = domain expert (expertise attribution)
 *
 * This is NOT sponsorship — it signals who is speaking and why they know it.
 * Modeled after Finimize's "Together with CoinShares" section.
 *
 * Future publications:
 *   THE MODE Daily Brief · THE MODE Founder Brief
 *   THE MODE Industry Brief · THE MODE Market Brief
 *   → each powered by a different venture's expertise
 */
export type TheModeVenture = {
  name: string
  tagline: string
  url?: string
}

const VENTURE_MAP: Record<string, TheModeVenture> = {
  'jd_ai_systems': {
    name: 'JD AI Systems',
    tagline: 'Curated intelligence for AI infrastructure and automation operators.',
  },
  'jd_productions': {
    name: 'JD Productions',
    tagline: 'Curated intelligence for media, entertainment, and creative operators.',
  },
  'white_lane': {
    name: 'White Lane Group',
    tagline: 'Curated intelligence for executive transportation and luxury service operators.',
  },
  'regal': {
    name: 'REGAL',
    tagline: 'Curated intelligence for youth development and community impact leaders.',
  },
  'founder_office': {
    name: 'The Founder Office',
    tagline: 'Curated intelligence for multi-arm founders and empire builders.',
  },
  'the_collection': {
    name: 'The Collection',
    tagline: 'Curated intelligence for creators, artists, and cultural brand operators.',
  },
  'walking_paintbrush': {
    name: 'Walking Paintbrush Foundation',
    tagline: 'Curated intelligence for nonprofit leaders and social impact builders.',
  },
}

const CATEGORY_TO_VENTURE: [RegExp, string][] = [
  [/\b(ai|artificial intelligence|automation|machine learning|llm|openai|anthropic|model|agent|mcp|infrastructure|tech|software|saas)\b/i, 'jd_ai_systems'],
  [/\b(media|entertainment|music|film|cinema|streaming|record|label|artist|creative|content creator|podcast|studio)\b/i, 'jd_productions'],
  [/\b(transport|chauffeur|luxury|executive travel|fleet|vehicle|ride|limousine)\b/i, 'white_lane'],
  [/\b(youth|community|at.risk|nonprofit|faith|church|social services|group home|foster|special needs)\b/i, 'regal'],
  [/\b(art|gallery|fine art|artist|painter|visual|collection|NFT|creator economy)\b/i, 'the_collection'],
  [/\b(founder|operator|empire|holding|multi.arm|strategy|venture|startup|consulting|business model)\b/i, 'founder_office'],
  [/\b(market|invest|etf|stock|crypto|finance|wealth|capital|trading|economy|GDP)\b/i, 'founder_office'],
]

export function resolveCollaboratingVenture(category?: string, topic?: string): TheModeVenture {
  const signal = `${category ?? ''} ${topic ?? ''}`.toLowerCase()
  for (const [pattern, key] of CATEGORY_TO_VENTURE) {
    if (pattern.test(signal)) return VENTURE_MAP[key]!
  }
  return VENTURE_MAP['founder_office']!
}

export type TheModeEmailOptions = {
  preheader?: string
  readMinutes?: number
  dateLabel?: string
  heroImageUrl?: string
  collaboratingVenture?: TheModeVenture
  bodyHtml: string
  marketing?: { email: string; category: MarketingEmailCategory }
}

function complianceFooter(marketing?: TheModeEmailOptions['marketing']): string {
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
    unsubscribe = `<a href="${unsubscribeHref}" style="color:${THE_MODE.muted};">Unsubscribe</a> · `
  }

  return `
    <tr>
      <td style="padding:24px 28px 30px;border-top:1px solid ${THE_MODE.border};font-family:system-ui,-apple-system,sans-serif;font-size:12px;line-height:1.7;color:${THE_MODE.faint};text-align:center;">
        ${unsubscribe}
        <a href="${prefs}" style="color:${THE_MODE.muted};">Email preferences</a> ·
        <a href="${privacy}" style="color:${THE_MODE.muted};">Privacy</a> ·
        <a href="${terms}" style="color:${THE_MODE.muted};">Terms</a><br/>
        <span style="display:block;margin-top:12px;">${getCompanyMailingAddress()}</span>
        <span style="display:block;margin-top:6px;">© ${new Date().getFullYear()} JD Productions · THE MODE is a JD Productions media brand</span>
      </td>
    </tr>
  `
}

export function renderTheModeEmailHtml(options: TheModeEmailOptions): string {
  const base = getAppBaseUrl()
  const read = options.readMinutes ?? 3
  const date =
    options.dateLabel ??
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const preheader = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${mdInline(options.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : ''

  const hero = options.heroImageUrl
    ? `<tr><td style="padding:0;"><img src="${options.heroImageUrl}" width="600" alt="THE MODE Daily Brief" style="display:block;width:100%;max-width:600px;height:auto;border:0;"/></td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/></head>
<body style="margin:0;padding:0;background:${THE_MODE.bg};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${THE_MODE.bg};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:600px;background:${THE_MODE.card};border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(13,17,23,0.10);">

      <!-- MASTHEAD -->
      <tr>
        <td style="background:${THE_MODE.masthead};padding:22px 28px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="bottom">
                <p style="margin:0 0 4px;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${THE_MODE.mastheadSub};">JD Productions · Daily Brief</p>
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;letter-spacing:-0.03em;color:${THE_MODE.mastheadText};line-height:1.0;">THE MODE</p>
              </td>
              <td valign="bottom" align="right">
                <a href="${base}/dashboard" style="color:${THE_MODE.mastheadSub};text-decoration:none;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:0.04em;">Open in browser →</a>
              </td>
            </tr>
          </table>
          <p style="margin:10px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:12px;letter-spacing:0.02em;color:${THE_MODE.faint};">${date} &nbsp;·&nbsp; ${read} min read &nbsp;·&nbsp; <span style="color:${THE_MODE.mastheadSub};font-style:italic;">Intelligence for operators. Filed daily.</span></p>
        </td>
      </tr>

      ${hero}

      <!-- COLLABORATION BLOCK -->
      ${options.collaboratingVenture ? `
      <tr>
        <td style="padding:0 28px 4px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${THE_MODE.accentSoft};border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:12px 16px;">
                <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${THE_MODE.accent};">The MODE × ${options.collaboratingVenture.name}</p>
                <p style="margin:3px 0 0;font-size:13px;line-height:1.5;color:${THE_MODE.muted};">${options.collaboratingVenture.tagline}</p>
              </td>
              <td width="24" valign="middle" style="padding-right:14px;font-size:18px;color:${THE_MODE.accent};">×</td>
            </tr>
          </table>
        </td>
      </tr>` : ''}

      <!-- BODY -->
      <tr>
        <td style="padding:22px 28px 8px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:16px;line-height:1.62;color:${THE_MODE.text};">
          ${options.bodyHtml}
        </td>
      </tr>

      ${complianceFooter(options.marketing)}
    </table>
    <p style="max-width:600px;margin:14px auto 0;font-family:system-ui,sans-serif;font-size:11px;color:${THE_MODE.faint};text-align:center;">What's your mode? Forward this to someone in theirs.</p>
  </td></tr>
</table>
</body></html>`
}

/* ── Section primitives ────────────────────────────────────────────── */

export function modeLabel(label: string): string {
  return `<p style="margin:26px 0 10px;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${THE_MODE.accent};">— ${label}</p>`
}

export function modeLede(text: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;">
      <tr>
        <td style="padding:2px 0 2px 16px;border-left:4px solid ${THE_MODE.rule};">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.34;font-weight:600;color:${THE_MODE.ink};">${mdInline(text)}</p>
        </td>
      </tr>
    </table>`
}

export function modeBullet(icon: string, html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;"><tr>
    <td width="24" valign="top" style="font-size:15px;line-height:1.6;color:${THE_MODE.accent};">${icon}</td>
    <td valign="top" style="font-size:15px;line-height:1.62;color:${THE_MODE.text};">${html}</td>
  </tr></table>`
}

export function modeDigestRow(label: string, title: string, summaryHtml: string, href?: string): string {
  const headline = href
    ? `<a href="${href}" style="color:${THE_MODE.accent};font-weight:700;text-decoration:none;">${mdInline(title)}</a>`
    : `<strong style="color:${THE_MODE.ink};">${mdInline(title)}</strong>`
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;"><tr>
    <td width="36" valign="top" style="font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${THE_MODE.accent};padding-top:3px;">${label}</td>
    <td valign="top" style="font-size:15px;line-height:1.5;">
      ${headline}<br/>
      <span style="color:${THE_MODE.muted};font-size:14px;">${summaryHtml}</span>
    </td>
  </tr></table>`
}

export function modePullQuote(text: string, attribution?: string): string {
  const clean = text.replace(/^"|"$/g, '')
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
      <tr>
        <td style="padding:12px 16px;background:${THE_MODE.accentSoft};border-left:3px solid ${THE_MODE.rule};border-radius:0 8px 8px 0;">
          <p style="margin:0;font-size:15px;line-height:1.55;font-style:italic;color:${THE_MODE.ink};">"${mdInline(clean)}"</p>
          ${attribution ? `<p style="margin:6px 0 0;font-size:12px;color:${THE_MODE.muted};">— ${mdInline(attribution)}</p>` : ''}
        </td>
      </tr>
    </table>`
}

export type ModeMetric = {
  label: string
  value: string
  pct?: number
  tone?: 'up' | 'down' | 'neutral'
}

function modeBar(pct: number, tone?: ModeMetric['tone']): string {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)))
  const color = tone === 'up' ? THE_MODE.up : tone === 'down' ? THE_MODE.down : THE_MODE.accent
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:7px 0 0;border-radius:6px;overflow:hidden;background:${THE_MODE.track};"><tr>
    <td style="height:6px;line-height:6px;font-size:0;background:${color};width:${clamped}%;">&nbsp;</td>
    <td style="height:6px;line-height:6px;font-size:0;width:${100 - clamped}%;">&nbsp;</td>
  </tr></table>`
}

function modeScoreCell(m: ModeMetric): string {
  const valColor = m.tone === 'up' ? THE_MODE.up : m.tone === 'down' ? THE_MODE.down : THE_MODE.ink
  return `
    <td width="50%" valign="top" style="padding:10px 12px;">
      <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${THE_MODE.faint};">${m.label}</p>
      <p style="margin:3px 0 0;font-size:19px;font-weight:800;color:${valColor};line-height:1.1;">${mdInline(m.value)}</p>
      ${typeof m.pct === 'number' ? modeBar(m.pct, m.tone) : ''}
    </td>`
}

export function modeScoreboard(label: string, note: string, metrics: ModeMetric[]): string {
  if (!metrics.length) return ''
  const rows: string[] = []
  for (let i = 0; i < metrics.length; i += 2) {
    const left = modeScoreCell(metrics[i])
    const right = metrics[i + 1] ? modeScoreCell(metrics[i + 1]) : `<td width="50%">&nbsp;</td>`
    rows.push(`<tr>${left}${right}</tr>`)
  }
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:2px 0 8px;background:${THE_MODE.card};border:1px solid ${THE_MODE.border};border-radius:12px;overflow:hidden;">
      <tr><td style="padding:12px 14px 2px;">
        ${modeLabel(label)}
        ${note ? `<p style="margin:-4px 0 2px;font-size:13px;color:${THE_MODE.muted};">${mdInline(note)}</p>` : ''}
      </td></tr>
      <tr><td style="padding:0 2px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join('')}</table>
      </td></tr>
    </table>`
}

export function modeBarChart(
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
            <td style="font-size:13px;color:${THE_MODE.text};font-weight:600;">${mdInline(b.label)}</td>
            <td align="right" style="font-size:12px;color:${THE_MODE.muted};font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;">${b.value ?? `${Math.round(b.pct)}`}</td>
          </tr></table>
          ${modeBar(b.pct)}
        </td>
      </tr>`
    )
    .join('')
  return `
    <div style="margin:24px 0;padding-top:8px;border-top:1px solid ${THE_MODE.border};">
      ${modeLabel(title)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      ${caption ? `<p style="margin:8px 0 0;font-size:12px;color:${THE_MODE.faint};">${mdInline(caption)}</p>` : ''}
    </div>`
}
