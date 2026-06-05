import { getAppBaseUrl, getCompanyMailingAddress } from '@/lib/email/constants'
import { buildUnsubscribeUrl, createUnsubscribeToken } from '@/lib/email/tokens'
import type { MarketingEmailCategory } from '@/lib/email/constants'
import { mdInline } from '@/lib/email/templates/md'

/**
 * JD Productions — Finimize-grade editorial email layout.
 *
 * One shell, all ventures:
 *   venture: 'jd-productions' | 'bridge-video' | 'white-lane' | 'linc'
 *           | 'the-collection' | 'lil-dev' | 'jerry-devin' | 'access'
 *
 * Each venture gets its own accent color and wordmark.
 * The editorial structure (Finimize pattern) stays identical.
 */

// ─── Venture brand registry ───────────────────────────────────────────────────

export type JDPVenture =
  | 'jd-productions'
  | 'bridge-video'
  | 'white-lane'
  | 'linc'
  | 'the-collection'
  | 'lil-dev'
  | 'jerry-devin'
  | 'access'
  | 'regal'
  | 'walking-paintbrush'

const VENTURES: Record<JDPVenture, { name: string; accent: string; tagline: string }> = {
  'jd-productions':    { name: 'JD PRODUCTIONS',    accent: '#0A2540', tagline: 'Build what comes next.' },
  'bridge-video':      { name: 'BRIDGE VIDEO',       accent: '#1A1A1A', tagline: 'We make commercials. The kind people remember.' },
  'white-lane':        { name: 'WHITE LANE',         accent: '#1A1A16', tagline: 'Executive chauffeur.' },
  'linc':              { name: 'LINC',               accent: '#C9A46A', tagline: 'Love is the new currency.' },
  'the-collection':    { name: 'THE COLLECTION',     accent: '#0A2540', tagline: 'A living gallery of God\'s artwork.' },
  'lil-dev':           { name: 'LIL DEV',            accent: '#7C3AED', tagline: 'The world is watching.' },
  'jerry-devin':       { name: 'JERRY DEVIN',        accent: '#169B48', tagline: 'Music. Purpose. Movement.' },
  'access':            { name: 'ACCESS',             accent: '#40C0D0', tagline: 'The operating system for builders.' },
  'regal':             { name: 'REGAL',              accent: '#169B48', tagline: 'Revolutionary examples guiding a legacy.' },
  'walking-paintbrush':{ name: 'WALKING PAINTBRUSH', accent: '#169B48', tagline: 'Art that moves the world.' },
}

// ─── Design tokens ─────────────────────────────────────────────────────────────

export const JDP = {
  bg:         '#F5F3EF',   // warm cream
  card:       '#FFFFFF',
  ink:        '#0A0A08',
  text:       '#1A1A16',
  muted:      '#6B6B60',
  faint:      '#9A9A8E',
  border:     '#E4E0D8',
  highlight:  '#F0EDE6',
  accentSoft: '#F5F3EF',
} as const

// ─── Footer ───────────────────────────────────────────────────────────────────

function footer(
  venture: JDPVenture,
  marketing?: { email: string; category: MarketingEmailCategory }
): string {
  const base = getAppBaseUrl()
  const v = VENTURES[venture]

  let unsubscribe = ''
  if (marketing?.email) {
    const token =
      createUnsubscribeToken({ email: marketing.email, category: marketing.category }) ||
      createUnsubscribeToken({ email: marketing.email, category: 'all_marketing' })
    const href = token ? buildUnsubscribeUrl(token) : `${base}/unsubscribe`
    unsubscribe = `<a href="${href}" style="color:${JDP.faint};text-decoration:underline;">Unsubscribe</a> &middot; `
  }

  return `
    <tr>
      <td style="padding:24px 28px 28px;border-top:1px solid ${JDP.border};font-family:system-ui,-apple-system,sans-serif;font-size:11px;line-height:1.7;color:${JDP.faint};text-align:center;">
        ${unsubscribe}
        <a href="${base}/settings/notifications-email" style="color:${JDP.faint};text-decoration:underline;">Email preferences</a> &middot;
        <a href="${base}/privacy" style="color:${JDP.faint};text-decoration:underline;">Privacy</a> &middot;
        <a href="${base}/terms" style="color:${JDP.faint};text-decoration:underline;">Terms</a><br/>
        <span style="display:block;margin-top:10px;">${getCompanyMailingAddress()}</span>
        <span style="display:block;margin-top:6px;">© ${new Date().getFullYear()} JD Productions Inc. · ${v.name}</span>
      </td>
    </tr>`
}

// ─── Main render ──────────────────────────────────────────────────────────────

export type JDPEmailOptions = {
  venture?: JDPVenture
  preheader?: string
  issue?: string          // e.g. "No. 012" or "June 5, 2026"
  readMinutes?: number
  subject: string         // doubles as the display headline
  bodyHtml: string
  marketing?: { email: string; category: MarketingEmailCategory }
}

export function renderJDPEmailHtml(options: JDPEmailOptions): string {
  const venture = options.venture ?? 'jd-productions'
  const v = VENTURES[venture]
  const base = getAppBaseUrl()
  const read = options.readMinutes ?? 2
  const date = options.issue ??
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const preheader = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${options.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
</head>
<body style="margin:0;padding:0;background:${JDP.bg};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${JDP.bg};padding:28px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:600px;background:${JDP.card};border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(10,10,8,0.08);">

      <!-- Wordmark row -->
      <tr>
        <td style="padding:22px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${v.accent};">${v.name}</p>
                <p style="margin:3px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:11px;color:${JDP.faint};">${v.tagline}</p>
              </td>
              <td align="right" style="vertical-align:top;">
                <a href="${base}/dashboard" style="font-family:system-ui,sans-serif;font-size:11px;color:${JDP.faint};text-decoration:none;">${date} · ${read} min read</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Rule + headline -->
      <tr>
        <td style="padding:14px 28px 20px;border-bottom:2px solid ${v.accent};">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;letter-spacing:-0.02em;line-height:1.15;color:${JDP.ink};">${options.subject}</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:24px 28px 8px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.68;color:${JDP.text};">
          ${options.bodyHtml}
        </td>
      </tr>

      ${footer(venture, options.marketing)}
    </table>

    <p style="max-width:600px;margin:12px auto 0;font-family:system-ui,sans-serif;font-size:11px;color:${JDP.faint};text-align:center;">You're on the JD Productions list. Pass it to someone building something.</p>
  </td></tr>
</table>
</body></html>`
}

// ─── Section primitives (same pattern as Finimize) ─────────────────────────────

export function jdpSectionLabel(emoji: string, label: string, venture: JDPVenture = 'jd-productions'): string {
  const accent = VENTURES[venture].accent
  return `<p style="margin:24px 0 10px;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${accent};">${emoji ? emoji + ' ' : ''}${label}</p>`
}

export function jdpLede(text: string, venture: JDPVenture = 'jd-productions'): string {
  const accent = VENTURES[venture].accent
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">
      <tr>
        <td style="padding:2px 0 2px 14px;border-left:3px solid ${accent};">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.35;font-weight:600;color:${JDP.ink};">${mdInline(text)}</p>
        </td>
      </tr>
    </table>`
}

export function jdpParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.68;color:${JDP.text};">${mdInline(text)}</p>`
}

export function jdpBullet(icon: string, html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;"><tr>
    <td width="22" valign="top" style="font-size:14px;line-height:1.6;color:${JDP.muted};">${icon}</td>
    <td valign="top" style="font-size:15px;line-height:1.65;color:${JDP.text};">${html}</td>
  </tr></table>`
}

export function jdpPullQuote(text: string, attribution?: string, venture: JDPVenture = 'jd-productions'): string {
  const accent = VENTURES[venture].accent
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">
      <tr>
        <td style="padding:14px 18px;background:${JDP.highlight};border-left:3px solid ${accent};border-radius:0 8px 8px 0;">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;font-style:italic;color:${JDP.ink};">"${mdInline(text.replace(/^"|"$/g, ''))}"</p>
          ${attribution ? `<p style="margin:8px 0 0;font-size:12px;color:${JDP.muted};">— ${mdInline(attribution)}</p>` : ''}
        </td>
      </tr>
    </table>`
}

export function jdpCTA(label: string, href: string, venture: JDPVenture = 'jd-productions'): string {
  const accent = VENTURES[venture].accent
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="border-radius:7px;background:${accent};">
          <a href="${href}" style="display:inline-block;padding:13px 24px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;">${label}</a>
        </td>
      </tr>
    </table>`
}

export function jdpDivider(): string {
  return `<div style="height:1px;background:${JDP.border};margin:24px 0;"></div>`
}
