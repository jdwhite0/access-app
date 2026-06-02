/**
 * JD AI Systems — platform health & resilience types (cross-product).
 */

export const PLATFORM_ID = 'jd_ai_systems' as const

export type PlatformProductId =
  | 'access_os'
  | 'jyson'
  | 'build'
  | 'vault'
  | 'jd_ai_systems_core'

export type PlatformProviderId =
  | 'anthropic_claude'
  | 'openai'
  | 'supabase'
  | 'vercel'
  | 'clerk'
  | 'local_connector'
  | 'local_filesystem'
  | 'local_runtime'
  | 'browser_client'
  | 'unknown_provider'

export type PlatformServiceId =
  | 'api'
  | 'database'
  | 'auth'
  | 'connector'
  | 'sync_engine'
  | 'registry'
  | 'vault'
  | 'runtime'
  | 'ai_inference'
  | 'deployment'
  | 'configuration'
  | 'unknown_service'

export type HealthStatus =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'blocked'
  | 'offline'
  | 'unknown'

export type IncidentCategory =
  | 'provider_outage'
  | 'provider_degraded'
  | 'local_dev_environment'
  | 'database_schema'
  | 'connector'
  | 'sync_pipeline'
  | 'auth_session'
  | 'configuration_env'
  | 'product_specific'
  | 'unknown_unclassified'

export type StatusAudience =
  | 'internal_engineering'
  | 'operator'
  | 'consumer_public'
  | 'enterprise_admin'

export type ClassifiedIssueKind =
  | 'provider_degraded'
  | 'schema_blocked'
  | 'env_invalid'
  | 'env_missing'
  | 'connector_pairing_expired'
  | 'local_dev_conflict'
  | 'local_env_missing'
  | 'sync_not_ready'
  | 'auth_or_policy_blocked'
  | 'unknown_unclassified'

export type HealthEventSeverity = 'info' | 'warning' | 'error' | 'critical'

export type ClassifyErrorInput = {
  error?: unknown
  message?: string
  httpStatus?: number
  product?: PlatformProductId
  service?: PlatformServiceId
  providerHint?: PlatformProviderId
}
