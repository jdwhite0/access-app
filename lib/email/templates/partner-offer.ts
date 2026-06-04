import { getAppBaseUrl } from '@/lib/email/constants'
import { cardBlock, renderAccessEmailHtml } from '@/lib/email/templates/layout'

export function renderPartnerOfferEmail(input: {
  email: string
  partnerName: string
  offerExplanation: string
  benefit: string
  disclaimer: string
  ctaLabel: string
  ctaHref: string
}): { subject: string; html: string } {
  const base = getAppBaseUrl()
  const href = input.ctaHref.startsWith('http') ? input.ctaHref : `${base}${input.ctaHref}`

  const bodyHtml = `
    ${cardBlock('Partner offer', input.offerExplanation)}
    ${input.benefit ? cardBlock('Your benefit', input.benefit) : ''}
    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#8b92a8;border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;">
      <strong>Disclosure:</strong> ${input.disclaimer} Partner: ${input.partnerName}.
    </p>
  `

  return {
    subject: `Partner offer — ${input.partnerName}`,
    html: renderAccessEmailHtml({
      preheader: input.benefit.slice(0, 120),
      title: 'Partner Offer',
      bodyHtml,
      cta: { label: input.ctaLabel, href },
      marketing: { email: input.email, category: 'partner_offers' },
    }),
  }
}
