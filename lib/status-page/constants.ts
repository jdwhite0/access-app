import type { HealthStatus } from '@/lib/platform-health'

export const CONSUMER_PRODUCT_NAMES: Record<string, string> = {
  access_os: 'ACCESS',
  jyson: 'JYSON',
  build: 'Build Platform',
  vault: 'Intelligence Vault',
  jd_ai_systems_core: 'Platform Core',
}

/** Consumer-facing products only (hide internal core on public page). */
export const CONSUMER_VISIBLE_PRODUCTS = new Set([
  'access_os',
  'jyson',
  'build',
  'vault',
])

export const OVERALL_CONSUMER_LABEL: Record<HealthStatus, string> = {
  operational: 'All Systems Operational',
  degraded: 'Degraded Performance',
  partial_outage: 'Partial Service Disruption',
  blocked: 'Service Disruption',
  offline: 'Major Outage',
  unknown: 'Status Unknown',
}

export const OVERALL_OPERATOR_LABEL: Record<HealthStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  partial_outage: 'Partial Outage',
  blocked: 'Blocked',
  offline: 'Offline',
  unknown: 'Unknown',
}
