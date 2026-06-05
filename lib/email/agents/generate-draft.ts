import type { EmailDraft, EmailIntakePayload, IntakeRouteResult } from '@/lib/email/agents/types'
import { renderDailyBriefEmail } from '@/lib/email/templates/daily-brief'
import { renderDailyBriefFinimizeEmail } from '@/lib/email/templates/daily-brief-finimize'
import { renderDailyBriefTheModeEmail } from '@/lib/email/templates/daily-brief-the-mode'
import { renderWeeklyDigestEmail } from '@/lib/email/templates/weekly-digest'
import { renderProductUpdateEmail } from '@/lib/email/templates/product-update'
import { renderFounderNoteEmail } from '@/lib/email/templates/founder-note'
import { renderEducationalContentEmail } from '@/lib/email/templates/educational-content'
import { renderPartnerOfferEmail } from '@/lib/email/templates/partner-offer'
import { renderConnectorOfflineAlertEmail } from '@/lib/email/templates/connector-offline'
import { renderSyncFailureAlertEmail } from '@/lib/email/templates/sync-failure'

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function generateEmailDraft(
  route: IntakeRouteResult,
  intake: EmailIntakePayload,
  recipient?: { email: string; handle?: string; user_id?: string }
): EmailDraft {
  const p = intake.payload ?? {}
  const email = recipient?.email ?? (p.email as string) ?? 'user@example.com'
  const handle = recipient?.handle ?? (p.handle as string) ?? 'operator'

  let subject = 'ACCESS Intelligence'
  let html = ''
  let preview = ''

  switch (route.email_type) {
    case 'daily_brief': {
      const template = String(p.template ?? '')
      const useTheMode =
        template === 'the_mode' ||
        template === 'daily_brief_the_mode' ||
        intake.source_type === 'the_mode_dossier' ||
        (p.subscriber_source as string | undefined) === 'the_mode_podcast'

      const useFinimize =
        !useTheMode &&
        (template === 'daily_brief_finimize' ||
          template === 'daily_brief_v2' ||
          intake.source_type === 'access_intelligence_dossier')

      if (useTheMode) {
        const r = renderDailyBriefTheModeEmail({
          email,
          handle,
          subject_line: typeof p.subject_line === 'string' ? p.subject_line : undefined,
          dossier_id: String(p.access_intelligence_dossier_id ?? intake.source_id ?? 'dossier'),
          topic: typeof p.topic === 'string' ? p.topic : undefined,
          market_signal: p.market_signal as { category?: string; summary?: string } | undefined,
          hook: typeof p.hook === 'string' ? p.hook : undefined,
          signal_score: typeof p.signal_score === 'number' ? p.signal_score : undefined,
          confidence_score: typeof p.confidence_score === 'number' ? p.confidence_score : undefined,
          timing_rationale: typeof p.timing_rationale === 'string' ? p.timing_rationale : undefined,
          verified_sources_count:
            typeof p.verified_sources_count === 'number' ? p.verified_sources_count : undefined,
          sources_count: typeof p.sources_count === 'number' ? p.sources_count : undefined,
          sources: Array.isArray(p.sources)
            ? (p.sources as { label?: string; url?: string; verified?: boolean }[])
            : [],
          pain_points: Array.isArray(p.pain_points) ? (p.pain_points as string[]) : [],
          intelligence: String(p.intelligence ?? p.intelligence_summary ?? p.executive_read ?? ''),
          headlines: Array.isArray(p.headlines)
            ? (p.headlines as { title: string; explainer?: string; source_url?: string; source_label?: string }[])
            : [],
          key_takeaways: Array.isArray(p.key_takeaways) ? (p.key_takeaways as string[]) : [],
          recommendedAction: String(p.recommended_action ?? p.recommendedAction ?? ''),
          productTip: String(p.product_tip ?? p.productTip ?? ''),
          positioning_read: typeof p.positioning_read === 'string' ? p.positioning_read : undefined,
          visual_ideas: Array.isArray(p.visual_ideas)
            ? (p.visual_ideas as { slot?: string; description?: string; format?: string }[])
            : [],
          charts: Array.isArray(p.charts)
            ? (p.charts as {
                title?: string
                type?: 'bar' | 'line'
                labels: string[]
                series: { label?: string; data: number[]; color?: string }[]
                unit?: string
                caption?: string
              }[])
            : [],
          feedback_enabled: p.feedback_enabled !== false,
        })
        subject = r.subject
        html = r.html
        preview = String(p.preheader ?? p.recommended_action ?? '').slice(0, 120)
      } else if (useFinimize) {
        const r = renderDailyBriefFinimizeEmail({
          email,
          handle,
          subject_line: typeof p.subject_line === 'string' ? p.subject_line : undefined,
          dossier_id: String(p.access_intelligence_dossier_id ?? intake.source_id ?? 'dossier'),
          topic: typeof p.topic === 'string' ? p.topic : undefined,
          market_signal: p.market_signal as { category?: string; summary?: string } | undefined,
          hook: typeof p.hook === 'string' ? p.hook : undefined,
          signal_score: typeof p.signal_score === 'number' ? p.signal_score : undefined,
          confidence_score: typeof p.confidence_score === 'number' ? p.confidence_score : undefined,
          timing_rationale: typeof p.timing_rationale === 'string' ? p.timing_rationale : undefined,
          verified_sources_count:
            typeof p.verified_sources_count === 'number' ? p.verified_sources_count : undefined,
          sources_count: typeof p.sources_count === 'number' ? p.sources_count : undefined,
          sources: Array.isArray(p.sources)
            ? (p.sources as { label?: string; url?: string; verified?: boolean }[])
            : [],
          pain_points: Array.isArray(p.pain_points) ? (p.pain_points as string[]) : [],
          intelligence: String(p.intelligence ?? p.intelligence_summary ?? p.executive_read ?? ''),
          headlines: Array.isArray(p.headlines)
            ? (p.headlines as { title: string; explainer?: string; source_url?: string; source_label?: string }[])
            : [],
          key_takeaways: Array.isArray(p.key_takeaways) ? (p.key_takeaways as string[]) : [],
          recommendedAction: String(p.recommended_action ?? p.recommendedAction ?? ''),
          productTip: String(p.product_tip ?? p.productTip ?? ''),
          positioning_read: typeof p.positioning_read === 'string' ? p.positioning_read : undefined,
          visual_ideas: Array.isArray(p.visual_ideas)
            ? (p.visual_ideas as { slot?: string; description?: string; format?: string }[])
            : [],
          charts: Array.isArray(p.charts)
            ? (p.charts as {
                title?: string
                type?: 'bar' | 'line'
                labels: string[]
                series: { label?: string; data: number[]; color?: string }[]
                unit?: string
                caption?: string
              }[])
            : [],
          feedback_enabled: p.feedback_enabled !== false,
        })
        subject = r.subject
        html = r.html
        preview = String(p.preheader ?? p.recommended_action ?? '').slice(0, 120)
      } else {
        const r = renderDailyBriefEmail({
          email,
          handle,
          systemStatus: String(p.system_status ?? p.systemStatus ?? 'Systems nominal.'),
          intelligence: String(p.intelligence ?? p.intelligence_summary ?? p.executive_read ?? ''),
          recommendedAction: String(p.recommended_action ?? p.recommendedAction ?? ''),
          productTip: String(p.product_tip ?? p.productTip ?? ''),
        })
        subject = r.subject
        html = r.html
        preview = String(p.recommended_action ?? '').slice(0, 120)
      }
      break
    }
    case 'weekly_digest': {
      const highlights = Array.isArray(p.highlights)
        ? (p.highlights as string[])
        : Array.isArray(p.strongest_signals)
          ? (p.strongest_signals as string[])
          : []
      const r = renderWeeklyDigestEmail({
        email,
        handle,
        highlights,
        weekSummary: String(p.week_summary ?? p.weekly_summary ?? ''),
      })
      subject = r.subject
      html = r.html
      preview = highlights[0]?.slice(0, 120) ?? ''
      break
    }
    case 'product_update': {
      const r = renderProductUpdateEmail({
        email,
        headline: String(p.headline ?? p.change_summary ?? 'Product update'),
        summary: String(p.summary ?? p.benefit_summary ?? ''),
        details: String(p.release_notes ?? p.details ?? ''),
      })
      subject = r.subject
      html = r.html
      preview = String(p.summary ?? '').slice(0, 120)
      break
    }
    case 'founder_note': {
      const r = renderFounderNoteEmail({
        email,
        authorName: String(p.author_name ?? 'Jerry Devin'),
        strategicTheme: String(p.strategic_theme ?? ''),
        founderMessage: String(p.founder_note ?? p.approved_source_text ?? ''),
        ctaLabel: String((p.cta as { label?: string })?.label ?? 'Open ACCESS'),
        ctaHref: String((p.cta as { href?: string })?.href ?? '/dashboard'),
      })
      subject = r.subject
      html = r.html
      preview = String(p.strategic_theme ?? '').slice(0, 120)
      break
    }
    case 'educational_content': {
      const steps = Array.isArray(p.steps) ? (p.steps as string[]) : []
      const r = renderEducationalContentEmail({
        email,
        handle,
        topic: String(p.tutorial_topic ?? p.topic ?? 'ACCESS workflow'),
        lesson: String(p.lesson_outline ?? p.lesson ?? ''),
        steps,
        useCase: String(p.use_case ?? p.product_context ?? ''),
      })
      subject = r.subject
      html = r.html
      preview = String(p.tutorial_topic ?? '').slice(0, 120)
      break
    }
    case 'partner_offer': {
      const r = renderPartnerOfferEmail({
        email,
        partnerName: String(p.partner_name ?? 'Partner'),
        offerExplanation: String(p.partner_offer ?? p.partner_description ?? ''),
        benefit: String(p.benefit ?? ''),
        disclaimer: String(p.compliance_disclaimer ?? 'Partner offer — not affiliated endorsement unless stated.'),
        ctaLabel: String((p.cta as { label?: string })?.label ?? 'Learn more'),
        ctaHref: String((p.cta as { href?: string })?.href ?? '#'),
      })
      subject = r.subject
      html = r.html
      preview = String(p.benefit ?? '').slice(0, 120)
      break
    }
    case 'connector_alert': {
      const r = renderConnectorOfflineAlertEmail({
        handle,
        deviceName: String(p.connector_name ?? 'Connector'),
        lastSeen: String(p.detected_at ?? new Date().toISOString()),
      })
      subject = r.subject
      html = r.html
      preview = `Connector offline: ${p.connector_name ?? 'integration'}`
      break
    }
    case 'sync_failure': {
      const r = renderSyncFailureAlertEmail({
        handle,
        vaultName: String(p.sync_target ?? 'vault sync'),
        errorSummary: String(p.failure_reason ?? 'Unknown error'),
      })
      subject = r.subject
      html = r.html
      preview = `Sync failure: ${p.sync_target ?? 'target'}`
      break
    }
  }

  return {
    subject,
    preview_text: preview,
    html_body: html,
    text_body: stripHtml(html),
    metadata: {
      email_type: route.email_type,
      category: route.category,
      transactional_or_marketing: route.transactional_or_marketing,
      source_type: intake.source_type,
      source_id: intake.source_id ?? intake.source_path,
      generated_at: new Date().toISOString(),
    },
  }
}
