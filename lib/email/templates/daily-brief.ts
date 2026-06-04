import { getAppBaseUrl } from '@/lib/email/constants'
import { cardBlock, renderAccessEmailHtml } from '@/lib/email/templates/layout'

export function renderDailyBriefEmail(input: {
  email: string
  handle: string
  systemStatus: string
  intelligence: string
  recommendedAction: string
  productTip: string
}): { subject: string; html: string } {
  const base = getAppBaseUrl()
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#8b92a8;">Good morning — your ACCESS command brief for <strong style="color:#e8eaef;">${input.handle}</strong>.</p>
    ${cardBlock('System status', input.systemStatus)}
    ${cardBlock("Today's intelligence", input.intelligence)}
    ${cardBlock('Recommended action', input.recommendedAction)}
    ${cardBlock('Product tip', input.productTip)}
    <p style="margin:16px 0 0;font-size:13px;color:#8b92a8;">Was this brief useful? Reply or use the feedback link in your dashboard.</p>
  `

  return {
    subject: `ACCESS Daily Brief — ${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
    html: renderAccessEmailHtml({
      preheader: input.recommendedAction.slice(0, 120),
      title: 'Daily Brief',
      bodyHtml,
      cta: { label: 'Open ACCESS', href: `${base}/dashboard` },
      marketing: { email: input.email, category: 'daily_brief' },
    }),
  }
}
