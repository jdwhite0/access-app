import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { classifyError } from '@/lib/platform-health'
import type { ClassifyErrorInput, StatusAudience } from '@/lib/platform-health'

export type ClassifiedApiError = {
  ok: false
  success: false
  kind: string
  status: string
  audience: StatusAudience
  message: string
  /** Backward-compat alias for message — connector client reads json.error */
  error: string
  correlationId: string
}

const HTTP_STATUS_FOR_KIND: Record<string, number> = {
  connector_pairing_expired: 400,
  auth_or_policy_blocked: 401,
  env_missing: 503,
  env_invalid: 503,
  schema_blocked: 503,
  local_env_missing: 503,
  local_dev_conflict: 503,
  sync_not_ready: 422,
  provider_degraded: 503,
  unknown_unclassified: 500,
}

/**
 * Classify a provider/infrastructure error and return a standardized NextResponse.
 *
 * Engineering detail is written to the server log only — never in the response body.
 * Consumer and operator responses are sanitized by the platform-health sanitizer.
 *
 * Shape:
 *   { ok, success, kind, status, audience, message, error, correlationId }
 *
 * `ok` and `error` are kept for backward compat with the connector binary client.
 */
export function classifiedErrorResponse(
  input: ClassifyErrorInput,
  opts?: {
    httpStatus?: number
    audience?: StatusAudience
  }
): NextResponse<ClassifiedApiError> {
  const audience: StatusAudience = opts?.audience ?? 'operator'
  const classified = classifyError(input)
  const correlationId = randomUUID()

  const httpStatus =
    opts?.httpStatus ??
    input.httpStatus ??
    HTTP_STATUS_FOR_KIND[classified.kind] ??
    500

  // Engineering detail: server log only — never leaves the server
  console.error(
    `[platform-health] id=${correlationId} kind=${classified.kind} provider=${classified.provider} status=${classified.status}`
  )

  const message = classified.event.messages[audience]

  return NextResponse.json<ClassifiedApiError>(
    {
      ok: false,
      success: false,
      kind: classified.kind,
      status: classified.status,
      audience,
      message,
      error: message,
      correlationId,
    },
    { status: httpStatus }
  )
}
