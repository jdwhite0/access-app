import type { EmailIntakePayload } from '@/lib/email/agents/types'

/**
 * Layer 2 — "research once, distribute everywhere".
 *
 * Reshapes ONE gated daily-brief intake (produced from the ACCESS Intelligence Dossier)
 * into a type-specific marketing email intake. The quality verdict travels unchanged,
 * so every marketing type is held to the same Quality Gate as the leading founder brief.
 *
 * Derivable from intelligence: weekly_digest, product_update, educational_content.
 * NOT derivable (needs external partner input): partner_offer — handled via manual intake.
 */
export type MarketingEmailType = 'weekly_digest' | 'product_update' | 'educational_content'

const SUPPORTED: MarketingEmailType[] = ['weekly_digest', 'product_update', 'educational_content']

export function isSupportedMarketingType(t: string): t is MarketingEmailType {
  return (SUPPORTED as string[]).includes(t)
}

function carryQuality(src: Record<string, unknown>): Record<string, unknown> {
  return {
    quality_passed: src.quality_passed,
    quality_score: src.quality_score,
    quality_grade: src.quality_grade,
    quality_blocking: src.quality_blocking,
  }
}

/** Build a marketing intake of `type` from a daily-brief intake. */
export function toMarketingIntake(
  brief: EmailIntakePayload,
  type: MarketingEmailType
): EmailIntakePayload {
  const p = brief.payload ?? {}
  const handle = (p.handle as string) ?? process.env.ACCESS_DAILY_BRIEF_HANDLE ?? 'operator'
  const topic = String(p.topic ?? '')
  const intelligence = String(p.intelligence ?? p.intelligence_summary ?? '')
  const takeaways = Array.isArray(p.key_takeaways) ? (p.key_takeaways as string[]) : []
  const headlines = Array.isArray(p.headlines)
    ? (p.headlines as { title?: string }[]).map((h) => h.title).filter(Boolean) as string[]
    : []
  const positioning = String(p.positioning_read ?? '')
  const recommended = String(p.recommended_action ?? '')
  const productCtx = String(p.product_context ?? p.product_tip ?? '')
  const signal = (p.market_signal as { summary?: string } | undefined)?.summary ?? intelligence
  const today = new Date().toISOString().slice(0, 10)
  const base = { handle, ...carryQuality(p), feedback_enabled: true }

  switch (type) {
    case 'weekly_digest': {
      const highlights = (takeaways.length ? takeaways : headlines).slice(0, 5)
      return {
        source_type: brief.source_type,
        source_id: `weekly-digest-${today}`,
        source_path: brief.source_path,
        payload: {
          ...base,
          email_type: 'weekly_digest',
          subject_line: `ACCESS Weekly — ${topic || 'the signals that moved'}`,
          week_summary: signal,
          highlights: highlights.length ? highlights : ['Review this week’s ACCESS intelligence.'],
          strongest_signals: highlights,
        },
      }
    }
    case 'product_update': {
      return {
        source_type: brief.source_type,
        source_id: `product-update-${today}`,
        source_path: brief.source_path,
        payload: {
          ...base,
          email_type: 'product_update',
          subject_line: `ACCESS — ${topic || 'what changed this week'}`,
          headline: String(p.hook ?? topic ?? 'Product update'),
          summary: positioning || signal,
          details: [recommended, productCtx].filter(Boolean).join('\n\n'),
        },
      }
    }
    case 'educational_content': {
      return {
        source_type: brief.source_type,
        source_id: `educational-${today}`,
        source_path: brief.source_path,
        payload: {
          ...base,
          email_type: 'educational_content',
          subject_line: `ACCESS Playbook — ${topic || 'put today’s signal to work'}`,
          tutorial_topic: topic || 'Operating on the latest signal',
          lesson_outline: intelligence,
          steps: takeaways.slice(0, 5),
          use_case: productCtx,
        },
      }
    }
  }
}
