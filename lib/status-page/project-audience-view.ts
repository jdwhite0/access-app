/**
 * Status page projections from Command Center bundle (audience enforcement).
 */
import {
  PRODUCT_REGISTRY,
  PROVIDER_REGISTRY,
  sanitizeForAudience,
} from '@/lib/platform-health'
import type { CommandCenterBundle, EnrichedRecommendation } from '@/lib/command-center/build-bundle'
import {
  CONSUMER_PRODUCT_NAMES,
  CONSUMER_VISIBLE_PRODUCTS,
  OVERALL_CONSUMER_LABEL,
  OVERALL_OPERATOR_LABEL,
} from '@/lib/status-page/constants'

export type StatusPageAudience = 'operator' | 'developer' | 'consumer'

export type ConsumerStatusPage = {
  ok: true
  audience: 'consumer'
  platform: string
  status: string
  operational: boolean
  updatedAt: string
  products: { name: string; status: string }[]
  incidents: { message: string; severity: string }[]
}

export type OperatorStatusPage = {
  ok: true
  audience: 'operator'
  updatedAt: string
  overall: string
  overallLabel: string
  operational: boolean
  openIncidents: number
  bySeverity: CommandCenterBundle['overview']['bySeverity']
  products: {
    id: string
    name: string
    status: string
    openIncidents: number
  }[]
  providers: CommandCenterBundle['providers']
  incidents: CommandCenterBundle['incidents']
  topAction: string | null
  commandCenterPath: string
}

export type DeveloperStatusPage = {
  ok: true
  audience: 'developer'
  updatedAt: string
  overall: string
  products: {
    product: string
    displayName: string
    status: string
    openIncidents: number
  }[]
  providers: {
    provider: string
    displayName: string
    category?: string
    status: string
    openIncidents: number
    statusPageUrl?: string
  }[]
  events: {
    id: string
    at: string
    product: string
    provider: string
    service: string
    status: string
    category: string
    kind: string
    severity: string
    summary: string
    messages: {
      engineering: string
      operator: string
      consumer: string
    }
    rawDetail: string | null
  }[]
  recommendations: EnrichedRecommendation[]
  meta: {
    eventCount: number
    auditSources: string[]
  }
}

export type StatusPageProjection =
  | ConsumerStatusPage
  | OperatorStatusPage
  | DeveloperStatusPage

export function projectStatusPage(
  audience: StatusPageAudience,
  bundle: CommandCenterBundle
): StatusPageProjection {
  switch (audience) {
    case 'consumer':
      return projectConsumerStatus(bundle)
    case 'developer':
      return projectDeveloperStatus(bundle)
    default:
      return projectOperatorStatus(bundle)
  }
}

export function projectConsumerStatus(bundle: CommandCenterBundle): ConsumerStatusPage {
  const { snapshot, events } = bundle
  const externalIncidents = events.filter(
    (e) =>
      e.category !== 'local_dev_environment' && e.status !== 'operational'
  )

  const products = snapshot.products
    .filter((p) => CONSUMER_VISIBLE_PRODUCTS.has(p.product))
    .map((p) => ({
      name: CONSUMER_PRODUCT_NAMES[p.product] ?? p.product,
      status: p.status === 'operational' ? 'Operational' : 'Disrupted',
    }))

  return {
    ok: true,
    audience: 'consumer',
    platform: 'JD AI Systems',
    status: OVERALL_CONSUMER_LABEL[snapshot.overall] ?? 'Status Unknown',
    operational: snapshot.overall === 'operational',
    updatedAt: bundle.generatedAt,
    products,
    incidents: externalIncidents.map((e) => ({
      message: sanitizeForAudience(e.messages.consumer_public, 'consumer_public'),
      severity: e.severity,
    })),
  }
}

export function projectOperatorStatus(bundle: CommandCenterBundle): OperatorStatusPage {
  const top = bundle.recommendations[0]
  return {
    ok: true,
    audience: 'operator',
    updatedAt: bundle.generatedAt,
    overall: bundle.overview.overall,
    overallLabel: OVERALL_OPERATOR_LABEL[bundle.overview.overall],
    operational: bundle.overview.overall === 'operational',
    openIncidents: bundle.overview.openIncidents,
    bySeverity: bundle.overview.bySeverity,
    products: bundle.products.map((p) => ({
      id: p.id,
      name: p.displayName,
      status: p.status,
      openIncidents: p.openIncidents,
    })),
    providers: bundle.providers,
    incidents: bundle.incidents,
    topAction: top?.action ?? null,
    commandCenterPath: '/internal/command-center',
  }
}

export function projectDeveloperStatus(bundle: CommandCenterBundle): DeveloperStatusPage {
  const { snapshot } = bundle
  return {
    ok: true,
    audience: 'developer',
    updatedAt: bundle.generatedAt,
    overall: snapshot.overall,
    products: snapshot.products.map((p) => ({
      product: p.product,
      displayName: PRODUCT_REGISTRY[p.product]?.displayName ?? p.product,
      status: p.status,
      openIncidents: p.openIncidents,
    })),
    providers: snapshot.providers.map((pr) => ({
      provider: pr.provider,
      displayName: PROVIDER_REGISTRY[pr.provider]?.displayName ?? pr.provider,
      category: PROVIDER_REGISTRY[pr.provider]?.category,
      status: pr.status,
      openIncidents: pr.openIncidents,
      statusPageUrl: PROVIDER_REGISTRY[pr.provider]?.statusPageUrl,
    })),
    events: snapshot.events.map((e) => ({
      id: e.id,
      at: e.at,
      product: e.product,
      provider: e.provider,
      service: e.service,
      status: e.status,
      category: e.category,
      kind: e.kind,
      severity: e.severity,
      summary: e.summary,
      messages: {
        engineering: e.messages.internal_engineering,
        operator: e.messages.operator,
        consumer: e.messages.consumer_public,
      },
      rawDetail: e.rawDetail ?? null,
    })),
    recommendations: bundle.recommendations,
    meta: {
      eventCount: snapshot.events.length,
      auditSources: [
        'supabase_url',
        'supabase_service_role',
        'connector_jwt',
        'vault_root',
        'clerk_auth',
      ],
    },
  }
}

/** Ensure consumer JSON never contains forbidden keys (CI guard). */
export function assertConsumerPayloadSafe(payload: ConsumerStatusPage): string[] {
  const issues: string[] = []
  const raw = JSON.stringify(payload)
  if (raw.includes('recommendations')) issues.push('consumer payload contains recommendations')
  if (raw.includes('rawDetail')) issues.push('consumer payload contains rawDetail')
  if (/\/Users\/|SUPABASE_SERVICE|sk-/.test(raw)) {
    issues.push('consumer payload may contain secrets or paths')
  }
  if (payload.audience !== 'consumer') issues.push('audience must be consumer')
  return issues
}
