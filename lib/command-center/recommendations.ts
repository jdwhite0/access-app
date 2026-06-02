/**
 * JD AI Systems — Command Center recommendations engine.
 *
 * Maps classified health event kinds into operator-facing action recommendations.
 * De-duplicates by kind — one recommendation per unique kind, grouping all
 * affected incidents, products, and providers under it.
 *
 * No external calls. Pure function over HealthEvent[].
 */
import { randomUUID } from 'node:crypto'
import type { HealthEvent, ClassifiedIssueKind, PlatformProductId, PlatformProviderId } from '@/lib/platform-health'

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low'

export type Recommendation = {
  id: string
  priority: RecommendationPriority
  kind: ClassifiedIssueKind
  action: string
  detail: string
  affectedProducts: PlatformProductId[]
  affectedProviders: PlatformProviderId[]
  incidentIds: string[]
}

// ─── Recommendation templates ────────────────────────────────────────────────

type RecommendationTemplate = {
  priority: RecommendationPriority
  action: string
  detail: string
}

const TEMPLATES: Record<ClassifiedIssueKind, RecommendationTemplate> = {
  env_missing: {
    priority: 'high',
    action: 'Configure missing environment variable',
    detail:
      'Check access-app/.env.local against .env.local.example and add the missing variable, then restart the dev server.',
  },
  env_invalid: {
    priority: 'high',
    action: 'Correct invalid environment variable',
    detail:
      'The configured value is present but malformed. Verify the format (e.g. full Supabase HTTPS URL) and update .env.local.',
  },
  connector_pairing_expired: {
    priority: 'high',
    action: 'Generate new pairing code and re-register the connector',
    detail:
      'Run: npm run pairing:code -- <handle>  then  npm run connector:register -- <CODE>  in packages/access-connector.',
  },
  auth_or_policy_blocked: {
    priority: 'critical',
    action: 'Review Clerk and Supabase permissions',
    detail:
      'Verify Clerk session is active, SUPABASE_JWT_SECRET is set, the tenant JWT path is correct, and access_set_request_context grants are applied.',
  },
  provider_degraded: {
    priority: 'medium',
    action: 'Monitor provider status page and pause dependent operations',
    detail:
      'The external AI provider is reporting degraded capacity. Pause AI-dependent workflows and check the provider status page for recovery ETA.',
  },
  schema_blocked: {
    priority: 'critical',
    action: 'Apply pending database migration',
    detail:
      'One or more required tables or functions are missing from Supabase. Apply migrations in order per docs/APPLY_ORDER.md then verify with npm run platform:verify-m0.',
  },
  local_env_missing: {
    priority: 'high',
    action: 'Set ACCESS_VAULT_ROOT environment variable',
    detail:
      'Export ACCESS_VAULT_ROOT to the JD AI Systems monorepo root before running connector scan, compile, or sync operations.',
  },
  local_dev_conflict: {
    priority: 'medium',
    action: 'Resolve local port conflict',
    detail:
      'A process is already using the required dev server port. Stop the conflicting process or change the port in your configuration.',
  },
  sync_not_ready: {
    priority: 'high',
    action: 'Complete sync prerequisites before applying',
    detail:
      'Verify schema with npm run platform:verify-m0, run npm run m4:dry-run, and obtain operator approval before executing sync:apply.',
  },
  unknown_unclassified: {
    priority: 'low',
    action: 'Investigate unclassified error and extend classifier',
    detail:
      'This error did not match any known pattern. Capture full server logs and add the pattern to lib/platform-health/error-classifier.ts.',
  },
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export function buildRecommendations(events: HealthEvent[]): Recommendation[] {
  // Group events by kind
  const byKind = new Map<ClassifiedIssueKind, HealthEvent[]>()

  for (const event of events) {
    const existing = byKind.get(event.kind) ?? []
    existing.push(event)
    byKind.set(event.kind, existing)
  }

  const recommendations: Recommendation[] = []

  for (const [kind, kindEvents] of byKind) {
    const template = TEMPLATES[kind]
    if (!template) continue

    const affectedProducts = [...new Set(kindEvents.map((e) => e.product))]
    const affectedProviders = [...new Set(kindEvents.map((e) => e.provider))]
    const incidentIds = kindEvents.map((e) => e.id)

    recommendations.push({
      id: randomUUID(),
      priority: template.priority,
      kind,
      action: template.action,
      detail: template.detail,
      affectedProducts,
      affectedProviders,
      incidentIds,
    })
  }

  // Sort: critical → high → medium → low
  const PRIORITY_RANK: Record<RecommendationPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  return recommendations.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
}
