import { getAppBaseUrl } from '@/lib/email/constants'
import { cardBlock, renderAccessEmailHtml } from '@/lib/email/templates/layout'
import {
  signalStrip,
  headlinesBlock,
  takeawaysBlock,
  visualSlotBlock,
  feedbackBlock,
  socialLinksBlock,
  type HeadlineInput,
  type VisualIdeaInput,
} from '@/lib/email/templates/blocks/intelligence-blocks'

export function renderDailyBriefV2Email(input: {
  email: string
  handle: string
  subject_line?: string
  dossier_id?: string
  systemStatus: string
  market_signal?: { category?: string; summary?: string }
  intelligence: string
  headlines?: HeadlineInput[]
  key_takeaways?: string[]
  recommendedAction: string
  productTip: string
  visual_ideas?: VisualIdeaInput[]
  feedback_enabled?: boolean
  cta?: { label: string; href: string }
}): { subject: string; html: string } {
  const base = getAppBaseUrl()
  const signalCategory = input.market_signal?.category ?? 'Market signal'
  const signalSummary = input.market_signal?.summary ?? input.systemStatus

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#8b92a8;">ACCESS Intelligence · Daily Brief for <strong style="color:#e8eaef;">${input.handle}</strong></p>
    ${signalStrip(signalCategory, signalSummary)}
    ${cardBlock('System status', input.systemStatus)}
    ${headlinesBlock(input.headlines ?? [])}
    ${cardBlock("Today's intelligence", input.intelligence)}
    ${takeawaysBlock(input.key_takeaways ?? [])}
    ${cardBlock('Recommended action', input.recommendedAction)}
    ${cardBlock('Operator tip', input.productTip)}
    ${visualSlotBlock(input.visual_ideas ?? [])}
    ${input.feedback_enabled !== false && input.dossier_id ? feedbackBlock(input.dossier_id, input.email) : ''}
    ${socialLinksBlock()}
  `

  const ctaHref = input.cta?.href.startsWith('http')
    ? input.cta.href
    : `${base}${input.cta?.href ?? '/dashboard'}`

  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return {
    subject:
      input.subject_line ??
      `ACCESS Daily Brief — ${input.recommendedAction.slice(0, 48)} · ${dateLabel}`,
    html: renderAccessEmailHtml({
      preheader: input.recommendedAction.slice(0, 120),
      title: 'Daily Brief',
      bodyHtml,
      cta: { label: input.cta?.label ?? 'Open ACCESS', href: ctaHref },
      marketing: { email: input.email, category: 'daily_brief' },
    }),
  }
}
