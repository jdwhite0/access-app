import { buildCommandCenterBundle } from '@/lib/command-center/build-bundle'
import {
  projectConsumerStatus,
  assertConsumerPayloadSafe,
} from '@/lib/status-page/project-audience-view'
import { publishConsumerStatusPayload } from '@/lib/status-page/consumer-cache'

export function buildAndPublishStatusBundle() {
  const bundle = buildCommandCenterBundle()
  const consumer = projectConsumerStatus(bundle)
  const issues = assertConsumerPayloadSafe(consumer)
  if (issues.length > 0) {
    throw new Error(`Consumer status projection unsafe: ${issues.join('; ')}`)
  }
  publishConsumerStatusPayload(consumer)
  return bundle
}
