import type {
  ClassifiedIssueKind,
  ClassifyErrorInput,
  HealthStatus,
  IncidentCategory,
  PlatformProductId,
  PlatformProviderId,
  PlatformServiceId,
} from './status-types'
import { buildAudienceMessages } from './status-message'
import type { HealthEvent } from './health-event'
import { createHealthEvent } from './health-event'

export type ClassifiedError = {
  kind: ClassifiedIssueKind
  category: IncidentCategory
  status: HealthStatus
  product: PlatformProductId
  provider: PlatformProviderId
  service: PlatformServiceId
  httpStatus?: number
  code?: string
  summary: string
  event: HealthEvent
}

function normalizeMessage(input: ClassifyErrorInput): string {
  const parts: string[] = []
  if (input.message) parts.push(input.message)
  if (input.error instanceof Error) {
    parts.push(input.error.message)
    if (input.error.cause instanceof Error) parts.push(input.error.cause.message)
  } else if (typeof input.error === 'string') {
    parts.push(input.error)
  } else if (input.error && typeof input.error === 'object') {
    const o = input.error as Record<string, unknown>
    if (typeof o.message === 'string') parts.push(o.message)
    if (typeof o.error === 'string') parts.push(o.error)
  }
  return parts.join(' ').trim()
}

function matchRules(
  text: string,
  hints: Pick<ClassifyErrorInput, 'httpStatus' | 'product' | 'service' | 'providerHint'>
): Omit<ClassifiedError, 'event' | 'summary'> & { summary: string } {
  const httpStatus = hints.httpStatus
  const lower = text.toLowerCase()

  const product: PlatformProductId = 'jd_ai_systems_core'
  let provider: PlatformProviderId = 'unknown_provider'
  let service: PlatformServiceId = 'unknown_service'
  let kind: ClassifiedIssueKind = 'unknown_unclassified'
  let category: IncidentCategory = 'unknown_unclassified'
  let status: HealthStatus = 'unknown'

  if (
    httpStatus === 529 ||
    /\b529\b/.test(text) ||
    /overloaded/i.test(text) ||
    /anthropic.*error/i.test(text) ||
    /claude.*unavailable/i.test(text) ||
    /elevated error/i.test(text)
  ) {
    kind = 'provider_degraded'
    category = 'provider_degraded'
    status = 'degraded'
    provider = 'anthropic_claude'
    service = 'ai_inference'
    return {
      kind,
      category,
      status,
      product,
      provider,
      service,
      httpStatus: httpStatus ?? 529,
      code: 'provider_overloaded',
      summary: 'Anthropic Claude API degraded or overloaded',
    }
  }

  if (/invalid supabaseurl|must be a valid http/i.test(text)) {
    kind = 'env_invalid'
    category = 'configuration_env'
    status = 'blocked'
    provider = 'supabase'
    service = 'configuration'
    return {
      kind,
      category,
      status,
      product: 'access_os',
      provider,
      service,
      code: 'env_invalid_url',
      summary: 'Invalid Supabase URL in environment',
    }
  }

  if (
    /does not exist/i.test(text) &&
    (/connector_pairing_codes|schema cache|42p01|pgrst205/i.test(text) ||
      /could not find the function/i.test(text) ||
      /pgrst202/i.test(text))
  ) {
    kind = 'schema_blocked'
    category = 'database_schema'
    status = 'blocked'
    provider = 'supabase'
    service = 'database'
    return {
      kind,
      category,
      status,
      product: 'access_os',
      provider,
      service,
      code: 'schema_missing',
      summary: 'Supabase schema object missing',
    }
  }

  if (/invalid or expired pairing code/i.test(text) || /pairing code.*expired/i.test(text)) {
    kind = 'connector_pairing_expired'
    category = 'connector'
    status = 'blocked'
    provider = 'local_connector'
    service = 'connector'
    return {
      kind,
      category,
      status,
      product: 'access_os',
      provider,
      service,
      code: 'pairing_expired',
      summary: 'Connector pairing code invalid or expired',
    }
  }

  if (
    /eaddrinuse/i.test(text) ||
    /port.*already in use/i.test(text) ||
    /address already in use/i.test(text)
  ) {
    kind = 'local_dev_conflict'
    category = 'local_dev_environment'
    status = 'blocked'
    provider = 'local_runtime'
    service = 'runtime'
    return {
      kind,
      category,
      status,
      product: 'access_os',
      provider,
      service,
      code: 'port_in_use',
      summary: 'Local dev port conflict',
    }
  }

  if (
    /access_vault_root/i.test(text) ||
    (/vault root/i.test(text) && /not found|missing/i.test(text))
  ) {
    kind = 'local_env_missing'
    category = 'local_dev_environment'
    status = 'blocked'
    provider = 'local_filesystem'
    service = 'vault'
    return {
      kind,
      category,
      status,
      product: 'vault',
      provider,
      service,
      code: 'vault_root_missing',
      summary: 'ACCESS_VAULT_ROOT missing or invalid',
    }
  }

  if (
    /sync apply is not ready|not ready for approved sync/i.test(text) ||
    (/sync:apply/i.test(text) && /not executed|blocked|skipped/i.test(text))
  ) {
    kind = 'sync_not_ready'
    category = 'sync_pipeline'
    status = 'blocked'
    provider = 'local_connector'
    service = 'sync_engine'
    return {
      kind,
      category,
      status,
      product: 'access_os',
      provider,
      service,
      code: 'sync_not_ready',
      summary: 'Sync apply blocked pending approval',
    }
  }

  if (
    /missing.*env|env.*not set|not configured/i.test(text) ||
    /supabase.*not configured/i.test(text)
  ) {
    kind = 'env_missing'
    category = 'configuration_env'
    status = 'blocked'
    provider = 'supabase'
    service = 'configuration'
    return {
      kind,
      category,
      status,
      product: 'access_os',
      provider,
      service,
      code: 'env_missing',
      summary: 'Required environment variable missing',
    }
  }

  if (
    /rls|row level security|jwt.*secret|tenant.*jwt|access_set_request_context|not signed in|unauthorized|401|403/i.test(
      text
    )
  ) {
    kind = 'auth_or_policy_blocked'
    category = 'auth_session'
    status = 'blocked'
    provider = /clerk/i.test(text) ? 'clerk' : 'supabase'
    service = 'auth'
    return {
      kind,
      category,
      status,
      product: 'access_os',
      provider,
      service,
      httpStatus: httpStatus === 401 || httpStatus === 403 ? httpStatus : undefined,
      code: 'auth_policy',
      summary: 'Auth or policy blocked operation',
    }
  }

  if (/openai/i.test(text) && /rate limit|overloaded|503|529/i.test(text)) {
    return {
      kind: 'provider_degraded',
      category: 'provider_degraded',
      status: 'degraded',
      product,
      provider: 'openai',
      service: 'ai_inference',
      httpStatus,
      code: 'openai_degraded',
      summary: 'OpenAI API degraded',
    }
  }

  return {
    kind,
    category,
    status,
    product: hints.product ?? product,
    provider: hints.providerHint ?? provider,
    service: hints.service ?? service,
    httpStatus,
    summary: text.slice(0, 120) || 'Unknown error',
  }
}

export function classifyError(input: ClassifyErrorInput): ClassifiedError {
  const text = normalizeMessage(input)
  const base = matchRules(text, input)

  const messages = buildAudienceMessages({
    kind: base.kind,
    product: base.product,
    provider: base.provider,
    category: base.category,
    rawDetail: text.slice(0, 500),
  })

  const event = createHealthEvent({
    product: input.product ?? base.product,
    provider: base.provider,
    service: base.service,
    status: base.status,
    category: base.category,
    kind: base.kind,
    severity:
      base.status === 'blocked' || base.status === 'offline'
        ? 'error'
        : base.status === 'degraded'
          ? 'warning'
          : 'info',
    summary: base.summary,
    httpStatus: base.httpStatus,
    code: base.code,
    messages,
    rawDetail: text.slice(0, 1000),
  })

  return { ...base, event }
}

export function classifyErrorFromUnknown(
  error: unknown,
  context?: Omit<ClassifyErrorInput, 'error'>
): ClassifiedError {
  return classifyError({ error, ...context })
}
