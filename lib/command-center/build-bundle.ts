/**
 * Single Command Center bundle — source of truth for status projections.
 */
import {
  buildHealthSnapshot,
  sanitizeForAudience,
  PRODUCT_REGISTRY,
  PROVIDER_REGISTRY,
  listProducts,
} from '@/lib/platform-health'
import type { HealthStatus, HealthEvent, PlatformHealthSnapshot } from '@/lib/platform-health'
import { collectRuntimeEvents } from '@/lib/command-center/runtime-audit'
import {
  buildRecommendations,
  type Recommendation,
} from '@/lib/command-center/recommendations'
import {
  getDefinition,
  type ResolutionStep,
} from '@/lib/command-center/recommendation-definitions'

// ─── Enriched recommendation ────────────────────────────────────────────────

export type EnrichedRecommendation = Recommendation & {
  /** Human-readable title from the definitions registry. */
  title: string
  /** Full description of the issue from the definitions registry. */
  description: string
  /** Short imperative call-to-action label. */
  actionLabel: string
  /** Ordered resolution checklist from the definitions registry. */
  resolutionSteps: ResolutionStep[]
}

export function enrichRecommendations(recs: Recommendation[]): EnrichedRecommendation[] {
  return recs.map((rec) => {
    const def = getDefinition(rec.kind)
    return {
      ...rec,
      title: def?.title ?? rec.action,
      description: def?.description ?? rec.detail,
      actionLabel: def?.actionLabel ?? rec.action,
      resolutionSteps: def?.resolutionSteps ?? [],
    }
  })
}

export type CommandCenterOverview = {
  platform: 'jd_ai_systems'
  overall: HealthStatus
  productCount: number
  openIncidents: number
  affectedProducts: number
  affectedProviders: number
  bySeverity: { critical: number; error: number; warning: number; info: number }
  healthyProducts: number
}

export type CommandCenterProduct = {
  id: string
  displayName: string
  description: string
  status: HealthStatus
  openIncidents: number
}

export type CommandCenterProvider = {
  id: string
  displayName: string
  category: string
  status: HealthStatus
  openIncidents: number
  statusPageUrl?: string
}

export type CommandCenterIncident = {
  id: string
  at: string
  kind: string
  category: string
  provider: string
  product: string
  service: string
  status: HealthStatus
  severity: string
  summary: string
  message: string
}

export type CommandCenterBundle = {
  ok: true
  generatedAt: string
  snapshot: PlatformHealthSnapshot
  events: HealthEvent[]
  overview: CommandCenterOverview
  products: CommandCenterProduct[]
  providers: CommandCenterProvider[]
  incidents: CommandCenterIncident[]
  recommendations: EnrichedRecommendation[]
}

export function buildCommandCenterBundle(
  events: HealthEvent[] = collectRuntimeEvents()
): CommandCenterBundle {
  const snapshot = buildHealthSnapshot(events)
  const recommendations = enrichRecommendations(buildRecommendations(events))

  const snapshotProductMap = new Map(snapshot.products.map((p) => [p.product, p]))

  const products = listProducts().map((def) => {
    const slice = snapshotProductMap.get(def.id)
    return {
      id: def.id,
      displayName: def.displayName,
      description: def.description,
      status: (slice?.status ?? 'operational') as HealthStatus,
      openIncidents: slice?.openIncidents ?? 0,
    }
  })

  const providers = snapshot.providers.map((slice) => {
    const def = PROVIDER_REGISTRY[slice.provider]
    return {
      id: slice.provider,
      displayName: def?.displayName ?? slice.provider,
      category: def?.category ?? 'unknown',
      status: slice.status,
      openIncidents: slice.openIncidents,
      statusPageUrl: def?.statusPageUrl,
    }
  })

  const incidents: CommandCenterIncident[] = events.map((e) => ({
    id: e.id,
    at: e.at,
    kind: e.kind,
    category: e.category,
    provider: e.provider,
    product: e.product,
    service: e.service,
    status: e.status,
    severity: e.severity,
    summary: e.summary,
    message: sanitizeForAudience(e.messages.operator, 'operator'),
  }))

  const severityCounts = { critical: 0, error: 0, warning: 0, info: 0 }
  for (const e of events) {
    if (e.severity in severityCounts) {
      severityCounts[e.severity as keyof typeof severityCounts]++
    }
  }

  const overview: CommandCenterOverview = {
    platform: 'jd_ai_systems',
    overall: snapshot.overall,
    productCount: Object.keys(PRODUCT_REGISTRY).length,
    openIncidents: events.length,
    affectedProducts: snapshot.products.length,
    affectedProviders: snapshot.providers.length,
    bySeverity: severityCounts,
    healthyProducts: products.filter((p) => p.status === 'operational').length,
  }

  return {
    ok: true,
    generatedAt: snapshot.at,
    snapshot,
    events,
    overview,
    products,
    providers,
    incidents,
    recommendations,
  }
}

/** API-safe payload (no raw HealthEvent engineering fields). */
export function toCommandCenterApiResponse(bundle: CommandCenterBundle) {
  return {
    ok: bundle.ok,
    generatedAt: bundle.generatedAt,
    overview: bundle.overview,
    products: bundle.products,
    providers: bundle.providers,
    incidents: bundle.incidents,
    recommendations: bundle.recommendations,
  }
}
