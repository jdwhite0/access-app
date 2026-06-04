import { getAppBaseUrl } from '@/lib/email/constants'
import { cardBlock, renderAccessEmailHtml } from '@/lib/email/templates/layout'

export function renderEducationalContentEmail(input: {
  email: string
  handle: string
  topic: string
  lesson: string
  steps: string[]
  useCase: string
}): { subject: string; html: string } {
  const base = getAppBaseUrl()
  const stepsHtml = input.steps.length
    ? `<ol style="margin:8px 0 0;padding-left:20px;color:#e8eaef;font-size:14px;">${input.steps.map((s) => `<li style="margin:0 0 8px;">${s}</li>`).join('')}</ol>`
    : ''

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#8b92a8;">Operator lesson for <strong style="color:#e8eaef;">${input.handle}</strong>.</p>
    ${cardBlock('Lesson', input.lesson)}
    ${stepsHtml ? `<div style="margin:0 0 16px;"><p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#8b92a8;">Steps</p>${stepsHtml}</div>` : ''}
    ${input.useCase ? cardBlock('Use case', input.useCase) : ''}
  `

  return {
    subject: `ACCESS Learn — ${input.topic}`,
    html: renderAccessEmailHtml({
      preheader: input.lesson.slice(0, 120),
      title: input.topic,
      bodyHtml,
      cta: { label: 'Open ACCESS', href: `${base}/dashboard` },
      marketing: { email: input.email, category: 'educational_content' },
    }),
  }
}
