import { getAppBaseUrl } from '@/lib/email/constants'
import { cardBlock, renderAccessEmailHtml } from '@/lib/email/templates/layout'

export function renderFounderNoteEmail(input: {
  email: string
  authorName: string
  strategicTheme: string
  founderMessage: string
  ctaLabel: string
  ctaHref: string
}): { subject: string; html: string } {
  const base = getAppBaseUrl()
  const href = input.ctaHref.startsWith('http') ? input.ctaHref : `${base}${input.ctaHref}`
  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:13px;color:#8b92a8;">From ${input.authorName}</p>
    ${input.strategicTheme ? cardBlock('Theme', input.strategicTheme) : ''}
    <div style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#e8eaef;">${input.founderMessage.replace(/\n/g, '<br/>')}</div>
  `

  return {
    subject: input.strategicTheme
      ? `Founder Note — ${input.strategicTheme}`
      : 'A note from the founder — ACCESS',
    html: renderAccessEmailHtml({
      preheader: input.founderMessage.slice(0, 120),
      title: 'Founder Note',
      bodyHtml,
      cta: { label: input.ctaLabel, href },
      marketing: { email: input.email, category: 'founder_notes' },
    }),
  }
}
