import type { HealthEvent } from './health-event'
import type {
  HealthStatus,
  PlatformProductId,
  PlatformProviderId,
} from './status-types'

const STATUS_RANK: Record<HealthStatus, number> = {
  operational: 0,
  unknown: 1,
  degraded: 2,
  partial_outage: 3,
  blocked: 4,
  offline: 5,
}

export type ProductHealthSlice = {
  product: PlatformProductId
  status: HealthStatus
  openIncidents: number
  latestEventId?: string
}

export type ProviderHealthSlice = {
  provider: PlatformProviderId
  status: HealthStatus
  openIncidents: number
}

export type PlatformHealthSnapshot = {
  at: string
  platform: 'jd_ai_systems'
  overall: HealthStatus
  products: ProductHealthSlice[]
  providers: ProviderHealthSlice[]
  events: HealthEvent[]
}

function maxStatus(a: HealthStatus, b: HealthStatus): HealthStatus {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b
}

export function buildHealthSnapshot(events: HealthEvent[]): PlatformHealthSnapshot {
  const productMap = new Map<PlatformProductId, ProductHealthSlice>()
  const providerMap = new Map<PlatformProviderId, ProviderHealthSlice>()

  let overall: HealthStatus = 'operational'

  for (const e of events) {
    overall = maxStatus(overall, e.status)

    const p =
      productMap.get(e.product) ??
      ({
        product: e.product,
        status: 'operational',
        openIncidents: 0,
      } satisfies ProductHealthSlice)

    p.status = maxStatus(p.status, e.status)
    p.openIncidents += 1
    p.latestEventId = e.id
    productMap.set(e.product, p)

    const pr =
      providerMap.get(e.provider) ??
      ({
        provider: e.provider,
        status: 'operational',
        openIncidents: 0,
      } satisfies ProviderHealthSlice)

    pr.status = maxStatus(pr.status, e.status)
    pr.openIncidents += 1
    providerMap.set(e.provider, pr)
  }

  return {
    at: new Date().toISOString(),
    platform: 'jd_ai_systems',
    overall,
    products: [...productMap.values()],
    providers: [...providerMap.values()],
    events,
  }
}
