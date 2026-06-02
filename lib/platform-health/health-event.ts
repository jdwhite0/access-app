import { randomUUID } from 'node:crypto'
import type {
  ClassifiedIssueKind,
  HealthEventSeverity,
  HealthStatus,
  IncidentCategory,
  PlatformProductId,
  PlatformProviderId,
  PlatformServiceId,
} from './status-types'
import type { AudienceMessages } from './status-message'

export type HealthEvent = {
  id: string
  at: string
  platform: 'jd_ai_systems'
  product: PlatformProductId
  provider: PlatformProviderId
  service: PlatformServiceId
  status: HealthStatus
  category: IncidentCategory
  kind: ClassifiedIssueKind
  severity: HealthEventSeverity
  summary: string
  httpStatus?: number
  code?: string
  messages: AudienceMessages
  /** Engineering-only detail; never expose to consumer_public without sanitize. */
  rawDetail?: string
}

export function createHealthEvent(input: {
  product: PlatformProductId
  provider: PlatformProviderId
  service: PlatformServiceId
  status: HealthStatus
  category: IncidentCategory
  kind: ClassifiedIssueKind
  severity: HealthEventSeverity
  summary: string
  httpStatus?: number
  code?: string
  messages: AudienceMessages
  rawDetail?: string
}): HealthEvent {
  return {
    id: randomUUID(),
    at: new Date().toISOString(),
    platform: 'jd_ai_systems',
    ...input,
  }
}
