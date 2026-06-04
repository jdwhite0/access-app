import { getAppBaseUrl } from '@/lib/email/constants'
import { cardBlock, renderAccessEmailHtml } from '@/lib/email/templates/layout'

export function renderWeeklyDigestEmail(input: {
  email: string
  handle: string
  highlights: string[]
  weekSummary: string
}): { subject: string; html: string } {
  const base = getAppBaseUrl()
  const list = input.highlights.map((h) => `<li style="margin:0 0 8px;">${h}</li>`).join('')
  const bodyHtml = `
    <p style="margin:0 0 16px;color:#8b92a8;">Weekly intelligence digest for <strong style="color:#e8eaef;">${input.handle}</strong>.</p>
    ${cardBlock('Week in review', input.weekSummary)}
    <div style="margin:0 0 16px;padding:14px 16px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8b92a8;">Highlights</p>
      <ul style="margin:0;padding-left:18px;color:#e8eaef;font-size:14px;">${list}</ul>
    </div>
  `

  return {
    subject: 'ACCESS Weekly Digest',
    html: renderAccessEmailHtml({
      title: 'Weekly Digest',
      bodyHtml,
      cta: { label: 'View workspace', href: `${base}/dashboard` },
      marketing: { email: input.email, category: 'weekly_digest' },
    }),
  }
}
