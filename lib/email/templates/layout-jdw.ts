import { getAppBaseUrl, getCompanyMailingAddress } from '@/lib/email/constants'

/**
 * JDWhite.world — founder portal email layout.
 *
 * Design language: void · portal · signal · transmission · personal
 *
 * Distinct from:
 *   layout-jdp.ts       → JD Productions (cream, editorial, business)
 *   layout-finimize.ts  → ACCESS intelligence (Finimize, data-driven)
 *   layout.ts           → ACCESS platform (white, product SaaS)
 *
 * Use this layout for ALL jdwhite.world outbound emails:
 *   - Business Dev (concierge follow-up, proposals, discovery)
 *   - Ecosystem (welcome, path selection, registry updates)
 *   - Founder (dispatch, field notes, thesis, open letters)
 *   - Product (ACCESS/JYSON/VAULT/BUILDER updates)
 */

// ─── Track system ──────────────────────────────────────────────────────────────

export type JDWTrack =
  | 'business_dev'   // Sales Concierge, proposals, client conversion
  | 'ecosystem'      // Welcome, paths, registry, world activations
  | 'founder'        // Dispatch, field notes, thesis, open letters
  | 'product'        // ACCESS, JYSON, VAULT, BUILDER updates
  | 'newsletter'     // Build What Comes Next, Ecosystem Update

const TRACK_LABELS: Record<JDWTrack, string> = {
  business_dev: 'JDWHITE.WORLD · BUSINESS',
  ecosystem:    'JDWHITE.WORLD · ECOSYSTEM',
  founder:      'JDWHITE.WORLD · FOUNDER',
  product:      'JDWHITE.WORLD · PRODUCT',
  newsletter:   'JDWHITE.WORLD · NEWSLETTER',
}

// ─── Design tokens ─────────────────────────────────────────────────────────────

export const JDW = {
  bg:       '#06070D',                    // void
  card:     '#0B0D1A',                    // card surface (subtle blue-dark)
  text:     'rgba(255,255,255,0.88)',     // primary text
  muted:    'rgba(255,255,255,0.42)',     // secondary text
  faint:    'rgba(255,255,255,0.18)',     // labels, metadata
  signal:   '#7B9CFF',                   // portal signal (cool indigo)
  border:   'rgba(255,255,255,0.07)',     // subtle borders
  surface:  'rgba(255,255,255,0.04)',     // raised surface blocks
} as const

// ─── Footer ────────────────────────────────────────────────────────────────────

function footer(email?: string): string {
  const base = getAppBaseUrl()

  const unsubLink = email
    ? `<a href="${base}/unsubscribe?email=${encodeURIComponent(email)}" style="color:${JDW.faint};text-decoration:underline;">Unsubscribe</a> &middot; `
    : ''

  return `
    <tr>
      <td style="padding:20px 28px 28px;border-top:1px solid ${JDW.border};font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;line-height:1.7;color:${JDW.faint};text-align:center;letter-spacing:0.06em;">
        ${unsubLink}
        <a href="${base}/privacy" style="color:${JDW.faint};text-decoration:underline;">PRIVACY</a> &middot;
        <a href="https://jdwhite.world" style="color:${JDW.faint};text-decoration:underline;">JDWHITE.WORLD</a><br/>
        <span style="display:block;margin-top:8px;">${getCompanyMailingAddress()}</span>
      </td>
    </tr>`
}

// ─── Options ───────────────────────────────────────────────────────────────────

export type JDWEmailOptions = {
  track?: JDWTrack
  subject: string
  preheader?: string
  label?: string          // overrides the track label (e.g. "SALES CONCIERGE · DEPT 01")
  issue?: string          // e.g. "No. 001" or "June 5, 2026"
  bodyHtml: string
  recipientEmail?: string // for unsubscribe link
}

// ─── Main render ───────────────────────────────────────────────────────────────

export function renderJDWEmailHtml(options: JDWEmailOptions): string {
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
  <meta name="color-scheme" content="dark"/>
</head>
<body style="margin:0;padding:0;background:${JDW.bg};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${JDW.bg};padding:28px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;background:${JDW.card};border-radius:10px;overflow:hidden;border:1px solid ${JDW.border};">

      <!-- Signal line -->
      <tr>
        <td style="padding:0;">
          <div style="height:2px;background:linear-gradient(90deg,${JDW.signal} 0%,rgba(123,156,255,0.3) 60%,transparent 100%);"></div>
        </td>
      </tr>

      <!-- Wordmark + label row -->
      <tr>
        <td style="padding:22px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:12px;font-weight:700;letter-spacing:0.20em;color:rgba(255,255,255,0.90);">JDWHITE.WORLD</p>
                <p style="margin:4px 0 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${JDW.faint};">${label}</p>
              </td>
              <td align="right" style="vertical-align:top;">
                <p style="margin:0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.08em;color:${JDW.faint};">${date}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Headline -->
      <tr>
        <td style="padding:16px 28px 22px;border-bottom:1px solid ${JDW.border};">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:-0.02em;line-height:1.2;color:rgba(255,255,255,0.92);">${options.subject}</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:24px 28px 8px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.68;color:${JDW.text};">
          ${options.bodyHtml}
        </td>
      </tr>

      ${footer(options.recipientEmail)}
    </table>

    <p style="max-width:560px;margin:12px auto 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.14);text-align:center;">TRANSMISSION FROM THE ECOSYSTEM</p>
  </td></tr>
</table>
</body></html>`
}

// ─── Section primitives ────────────────────────────────────────────────────────

export function jdwLabel(text: string): string {
  return `<p style="margin:20px 0 8px;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${JDW.signal};">${text}</p>`
}

export function jdwLede(text: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">
      <tr>
        <td style="padding:2px 0 2px 14px;border-left:2px solid ${JDW.signal};">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.35;font-weight:600;color:rgba(255,255,255,0.90);">${text}</p>
        </td>
      </tr>
    </table>`
}

export function jdwParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.68;color:${JDW.text};">${text}</p>`
}

export function jdwStep(num: string, html: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
      <tr>
        <td width="32" valign="top" style="font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:11px;font-weight:700;color:${JDW.signal};padding-top:1px;">${num}</td>
        <td valign="top" style="font-size:15px;line-height:1.65;color:${JDW.text};">${html}</td>
      </tr>
    </table>`
}

export function jdwBlock(html: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 20px;">
      <tr>
        <td style="padding:14px 18px;background:${JDW.surface};border:1px solid ${JDW.border};border-radius:8px;">
          <p style="margin:0;font-size:14px;line-height:1.65;color:${JDW.muted};">${html}</p>
        </td>
      </tr>
    </table>`
}

export function jdwCTA(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="border-radius:7px;background:${JDW.signal};">
          <a href="${href}" style="display:inline-block;padding:13px 24px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;font-weight:600;color:#06070D;text-decoration:none;letter-spacing:-0.01em;">${label}</a>
        </td>
      </tr>
    </table>`
}

export function jdwDivider(): string {
  return `<div style="height:1px;background:${JDW.border};margin:22px 0;"></div>`
}

export function jdwSignature(name = 'Jerry', title = 'Founder, JD Productions'): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
      <tr>
        <td>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-style:italic;color:${JDW.muted};">— ${name}</p>
          <p style="margin:4px 0 0;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:0.10em;color:${JDW.faint};">${title}</p>
        </td>
      </tr>
    </table>`
}
