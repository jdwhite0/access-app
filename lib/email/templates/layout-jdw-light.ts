import { getAppBaseUrl, getCompanyMailingAddress } from '@/lib/email/constants'

/**
 * JDWhite.world — LIGHT mode email layout.
 *
 * Use for: all emails AFTER first contact.
 *   - Follow-ups, proposals, dispatches, announcements,
 *     business development sequences, newsletters
 *
 * Use layout-jdw.ts (dark) for: first-contact portal-entry emails only.
 *   - Work With Me confirmation (first email to a new lead)
 *   - Newsletter welcome (first email to a new subscriber)
 *
 * Design: warm off-white + faint indigo galaxy wash + #7B9CFF signal thread.
 * The signal line and accent color are the connecting thread to the dark version.
 * Founder-led voice. Under 60 seconds to consume.
 */

// ─── Design tokens ─────────────────────────────────────────────────────────────

export const JDWL = {
  outerBg:    'linear-gradient(160deg, #EDEBF7 0%, #FAFAF8 28%, #FAFAF8 100%)', // faint galaxy wash
  bg:         '#FAFAF8',
  card:       '#FFFFFF',
  border:     '#E4E2EE',       // indigo-tinted border — not plain grey
  text:       '#0D0D14',       // near-black
  muted:      '#5A5A68',
  faint:      '#9A9AAA',
  signal:     '#7B9CFF',       // portal signal — same as dark version
  surface:    '#F4F2FA',       // raised surface blocks (slight indigo tint)
  surfaceBorder: '#E0DDEF',
} as const

// ─── Track labels ──────────────────────────────────────────────────────────────

export type JDWLTrack =
  | 'business_dev'
  | 'ecosystem'
  | 'founder'
  | 'product'
  | 'newsletter'

const TRACK_LABELS: Record<JDWLTrack, string> = {
  business_dev: 'JDWHITE.WORLD · BUSINESS',
  ecosystem:    'JDWHITE.WORLD · ECOSYSTEM',
  founder:      'JDWHITE.WORLD · FOUNDER',
  product:      'JDWHITE.WORLD · PRODUCT',
  newsletter:   'JDWHITE.WORLD · NEWSLETTER',
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function footer(email?: string): string {
  const base = getAppBaseUrl()

  const unsubLink = email
    ? `<a href="${base}/unsubscribe?email=${encodeURIComponent(email)}" style="color:${JDWL.faint};text-decoration:underline;">Unsubscribe</a> &middot; `
    : ''

  return `
    <tr>
      <td style="padding:20px 28px 28px;border-top:1px solid ${JDWL.border};font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;line-height:1.7;color:${JDWL.faint};text-align:center;letter-spacing:0.06em;">
        ${unsubLink}
        <a href="${base}/privacy" style="color:${JDWL.faint};text-decoration:underline;">PRIVACY</a> &middot;
        <a href="https://jdwhite.world" style="color:${JDWL.faint};text-decoration:underline;">JDWHITE.WORLD</a><br/>
        <span style="display:block;margin-top:8px;">${getCompanyMailingAddress()}</span>
      </td>
    </tr>`
}

// ─── Options ───────────────────────────────────────────────────────────────────

export type JDWLEmailOptions = {
  track?: JDWLTrack
  subject: string
  preheader?: string
  label?: string
  issue?: string
  bodyHtml: string
  recipientEmail?: string
}

// ─── Main render ───────────────────────────────────────────────────────────────

export function renderJDWLEmailHtml(options: JDWLEmailOptions): string {
  const track = options.track ?? 'founder'
  const label = options.label ?? TRACK_LABELS[track]
  const date = options.issue ??
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const preheader = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${options.preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="light"/>
</head>
<body style="margin:0;padding:0;background:#EDEBF7;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
  style="background:linear-gradient(160deg,#EDEBF7 0%,#F5F3FC 22%,#FAFAF8 100%);padding:28px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%"
      style="max-width:560px;background:${JDWL.card};border-radius:10px;overflow:hidden;border:1px solid ${JDWL.border};box-shadow:0 1px 4px rgba(60,40,120,0.06);">

      <!-- Signal line — connecting thread to dark version -->
      <tr>
        <td style="padding:0;">
          <div style="height:2px;background:linear-gradient(90deg,${JDWL.signal} 0%,rgba(123,156,255,0.25) 65%,transparent 100%);"></div>
        </td>
      </tr>

      <!-- Wordmark + label row -->
      <tr>
        <td style="padding:22px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:12px;font-weight:700;letter-spacing:0.20em;color:${JDWL.text};">JDWHITE.WORLD</p>
                <p style="margin:4px 0 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${JDWL.faint};">${label}</p>
              </td>
              <td align="right" style="vertical-align:top;">
                <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.08em;color:${JDWL.faint};">${date}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Headline -->
      <tr>
        <td style="padding:16px 28px 22px;border-bottom:1px solid ${JDWL.border};">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:-0.02em;line-height:1.2;color:${JDWL.text};">${options.subject}</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:24px 28px 8px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.68;color:${JDWL.text};">
          ${options.bodyHtml}
        </td>
      </tr>

      ${footer(options.recipientEmail)}
    </table>
  </td></tr>
</table>
</body></html>`
}

// ─── Section primitives (light variants) ──────────────────────────────────────

export function jdwlLabel(text: string): string {
  return `<p style="margin:20px 0 8px;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${JDWL.signal};">${text}</p>`
}

export function jdwlLede(text: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">
      <tr>
        <td style="padding:2px 0 2px 14px;border-left:2px solid ${JDWL.signal};">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.35;font-weight:600;color:${JDWL.text};">${text}</p>
        </td>
      </tr>
    </table>`
}

export function jdwlParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.68;color:${JDWL.muted};">${text}</p>`
}

export function jdwlStep(num: string, html: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
      <tr>
        <td width="32" valign="top" style="font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:11px;font-weight:700;color:${JDWL.signal};padding-top:1px;">${num}</td>
        <td valign="top" style="font-size:15px;line-height:1.65;color:${JDWL.muted};">${html}</td>
      </tr>
    </table>`
}

export function jdwlBlock(html: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">
      <tr>
        <td style="padding:14px 18px;background:${JDWL.surface};border:1px solid ${JDWL.surfaceBorder};border-radius:8px;">
          <p style="margin:0;font-size:14px;line-height:1.65;color:${JDWL.muted};">${html}</p>
        </td>
      </tr>
    </table>`
}

export function jdwlInfoCard(rows: Array<{ label: string; value: string }>): string {
  const rowHtml = rows.map(({ label, value }) => `
    <tr>
      <td style="padding:8px 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${JDWL.faint};width:130px;vertical-align:top;border-bottom:1px solid ${JDWL.border};">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:${JDWL.text};border-bottom:1px solid ${JDWL.border};">${value}</td>
    </tr>`).join('')

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;border:1px solid ${JDWL.border};border-radius:8px;overflow:hidden;">
      <tr><td style="padding:4px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${rowHtml}
        </table>
      </td></tr>
    </table>`
}

export function jdwlCTA(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="border-radius:7px;background:${JDWL.signal};">
          <a href="${href}" style="display:inline-block;padding:13px 24px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;letter-spacing:-0.01em;">${label}</a>
        </td>
      </tr>
    </table>`
}

export function jdwlDivider(): string {
  return `<div style="height:1px;background:${JDWL.border};margin:22px 0;"></div>`
}

export function jdwlSignature(name = 'JD White', title = 'Founder, JD Productions'): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
      <tr>
        <td>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-style:italic;color:${JDWL.muted};">— ${name}</p>
          <p style="margin:4px 0 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.10em;color:${JDWL.faint};">${title.toUpperCase()}</p>
        </td>
      </tr>
    </table>`
}
