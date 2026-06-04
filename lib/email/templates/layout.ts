import { getAppBaseUrl, getCompanyMailingAddress } from '@/lib/email/constants'
import { buildUnsubscribeUrl, createUnsubscribeToken } from '@/lib/email/tokens'
import type { MarketingEmailCategory } from '@/lib/email/constants'

const BRAND = {
  bg: '#0a0b10',
  card: '#12141c',
  border: 'rgba(255,255,255,0.08)',
  text: '#e8eaef',
  muted: '#8b92a8',
  accent: '#7c6cf0',
  accentSoft: 'rgba(124,108,240,0.15)',
  link: '#6eb5ff',
}

export type EmailTemplateOptions = {
  preheader?: string
  title: string
  bodyHtml: string
  cta?: { label: string; href: string }
  /** Marketing emails require footer compliance links. */
  marketing?: {
    email: string
    category: MarketingEmailCategory
  }
}

function complianceFooter(marketing?: EmailTemplateOptions['marketing']): string {
  const base = getAppBaseUrl()
  const privacy = `${base}/privacy`
  const terms = `${base}/terms`
  const prefs = `${base}/settings/notifications-email`
  const emailPrefsPublic = `${base}/email-preferences`

  let unsubscribe = ''
  if (marketing?.email) {
    const token =
      createUnsubscribeToken({ email: marketing.email, category: marketing.category }) ||
      createUnsubscribeToken({ email: marketing.email, category: 'all_marketing' })
    const unsubscribeHref = token ? buildUnsubscribeUrl(token) : `${base}/unsubscribe`
    unsubscribe = `<a href="${unsubscribeHref}" style="color:${BRAND.link};text-decoration:underline;">Unsubscribe</a> · `
  }

  return `
    <tr>
      <td style="padding:28px 24px 8px;border-top:1px solid ${BRAND.border};font-family:system-ui,-apple-system,sans-serif;font-size:11px;line-height:1.6;color:${BRAND.muted};">
        ${unsubscribe}
        <a href="${prefs}" style="color:${BRAND.link};text-decoration:underline;">Manage email preferences</a> ·
        <a href="${emailPrefsPublic}" style="color:${BRAND.link};text-decoration:underline;">Email preferences</a><br/>
        <a href="${privacy}" style="color:${BRAND.link};text-decoration:underline;">Privacy Policy</a> ·
        <a href="${terms}" style="color:${BRAND.link};text-decoration:underline;">Terms of Service</a><br/>
        <span style="display:block;margin-top:12px;">${getCompanyMailingAddress()}</span>
        <span style="display:block;margin-top:8px;">© ${new Date().getFullYear()} JD AI Systems · ACCESS Intelligence</span>
      </td>
    </tr>
  `
}

export function renderAccessEmailHtml(options: EmailTemplateOptions): string {
  const ctaRow = options.cta
    ? `<tr><td style="padding:16px 24px 8px;">
        <a href="${options.cta.href}" style="display:inline-block;padding:12px 22px;background:linear-gradient(135deg,${BRAND.accent},#5a8fd4);color:#fff;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">${options.cta.label}</a>
       </td></tr>`
    : ''

  const preheader = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${options.preheader}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid ${BRAND.border};">
          <span style="font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.2em;color:${BRAND.muted};">ACCESS</span>
          <span style="font-family:system-ui,sans-serif;font-size:18px;font-weight:600;color:${BRAND.text};display:block;margin-top:6px;">${options.title}</span>
        </td>
      </tr>
      <tr><td style="padding:20px 24px;font-family:system-ui,sans-serif;font-size:15px;line-height:1.55;color:${BRAND.text};">
        ${options.bodyHtml}
      </td></tr>
      ${ctaRow}
      ${complianceFooter(options.marketing)}
    </table>
  </td></tr>
</table>
</body></html>`
}

export function cardBlock(title: string, content: string): string {
  return `
    <div style="margin:0 0 16px;padding:14px 16px;background:rgba(124,108,240,0.08);border:1px solid rgba(124,108,240,0.2);border-radius:8px;">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8b92a8;">${title}</p>
      <p style="margin:0;font-size:14px;color:#e8eaef;">${content}</p>
    </div>
  `
}
