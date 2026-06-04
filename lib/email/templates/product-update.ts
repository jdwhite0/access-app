import { getAppBaseUrl } from '@/lib/email/constants'
import { cardBlock, renderAccessEmailHtml } from '@/lib/email/templates/layout'

export function renderProductUpdateEmail(input: {
  email: string
  headline: string
  summary: string
  details: string
}): { subject: string; html: string } {
  const base = getAppBaseUrl()
  const bodyHtml = `
    ${cardBlock('Update', input.summary)}
    <p style="margin:0;font-size:14px;line-height:1.6;color:#e8eaef;">${input.details}</p>
  `

  return {
    subject: `ACCESS — ${input.headline}`,
    html: renderAccessEmailHtml({
      title: input.headline,
      bodyHtml,
      cta: { label: 'See what changed', href: `${base}/dashboard` },
      marketing: { email: input.email, category: 'product_updates' },
    }),
  }
}
