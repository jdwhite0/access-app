import type { EmailIntakePayload, IntakeRouteResult } from '@/lib/email/agents/types'

const SOURCE_TO_AGENT: Record<string, IntakeRouteResult> = {
  jdai_dossier: {
    email_type: 'daily_brief',
    category: 'daily_brief',
    transactional_or_marketing: 'marketing',
    priority: 'normal',
    target_audience: 'daily_brief_subscribers',
    required_send_window: 'scheduled',
    routed_agent: 'daily-brief-agent',
    routing_reason: 'JDAI dossier default → daily brief workflow',
  },
  jdai_claude_packet: {
    email_type: 'educational_content',
    category: 'educational_content',
    transactional_or_marketing: 'marketing',
    priority: 'normal',
    target_audience: 'educational_content_subscribers',
    required_send_window: 'scheduled',
    routed_agent: 'educational-content-agent',
    routing_reason: 'Claude packet → educational content workflow',
  },
  product_release: {
    email_type: 'product_update',
    category: 'product_updates',
    transactional_or_marketing: 'marketing',
    priority: 'high',
    target_audience: 'product_update_subscribers',
    required_send_window: 'scheduled',
    routed_agent: 'product-update-agent',
    routing_reason: 'Product release notes intake',
  },
  founder_note: {
    email_type: 'founder_note',
    category: 'founder_notes',
    transactional_or_marketing: 'marketing',
    priority: 'normal',
    target_audience: 'founder_notes_subscribers',
    required_send_window: 'scheduled',
    routed_agent: 'founder-note-agent',
    routing_reason: 'Founder-approved note intake',
  },
  educational_topic: {
    email_type: 'educational_content',
    category: 'educational_content',
    transactional_or_marketing: 'marketing',
    priority: 'normal',
    target_audience: 'educational_content_subscribers',
    required_send_window: 'scheduled',
    routed_agent: 'educational-content-agent',
    routing_reason: 'Educational topic intake',
  },
  partner_offer: {
    email_type: 'partner_offer',
    category: 'partner_offers',
    transactional_or_marketing: 'marketing',
    priority: 'low',
    target_audience: 'partner_offer_subscribers',
    required_send_window: 'scheduled',
    routed_agent: 'partner-offer-agent',
    routing_reason: 'Partner offer — opt-in only',
  },
  connector_event: {
    email_type: 'connector_alert',
    category: 'connector_offline',
    transactional_or_marketing: 'transactional',
    priority: 'critical',
    target_audience: 'affected_user',
    required_send_window: 'immediate',
    routed_agent: 'connector-alert-agent',
    routing_reason: 'Connector offline event',
  },
  sync_event: {
    email_type: 'sync_failure',
    category: 'sync_failure',
    transactional_or_marketing: 'transactional',
    priority: 'critical',
    target_audience: 'affected_user',
    required_send_window: 'immediate',
    routed_agent: 'sync-failure-agent',
    routing_reason: 'Sync failure event',
  },
}

export function routeEmailIntake(intake: EmailIntakePayload): IntakeRouteResult {
  const payload = intake.payload ?? {}
  const explicitType = payload.email_type as string | undefined

  if (explicitType === 'weekly_digest') {
    return {
      email_type: 'weekly_digest',
      category: 'weekly_digest',
      transactional_or_marketing: 'marketing',
      priority: 'normal',
      target_audience: 'weekly_digest_subscribers',
      required_send_window: 'scheduled',
      routed_agent: 'weekly-digest-agent',
      routing_reason: 'Explicit weekly_digest email_type in payload',
    }
  }

  if (payload.transactional_override === true && intake.source_type === 'product_release') {
    return {
      ...SOURCE_TO_AGENT.product_release,
      transactional_or_marketing: 'transactional',
      routing_reason: 'Product release flagged transactional (billing/security)',
    }
  }

  const base = SOURCE_TO_AGENT[intake.source_type]
  if (base) return { ...base }

  return {
    email_type: 'daily_brief',
    category: 'daily_brief',
    transactional_or_marketing: 'marketing',
    priority: 'normal',
    target_audience: 'daily_brief_subscribers',
    required_send_window: 'scheduled',
    routed_agent: 'daily-brief-agent',
    routing_reason: 'Fallback route for manual/unknown source',
  }
}

export function classifyIntake(intake: EmailIntakePayload): IntakeRouteResult {
  return routeEmailIntake(intake)
}
