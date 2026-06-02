import type { ConsumerStatusPage } from '@/lib/status-page/project-audience-view'

let lastConsumer: { payload: ConsumerStatusPage; at: string } | null = null

export function publishConsumerStatusPayload(payload: ConsumerStatusPage): void {
  lastConsumer = { payload, at: payload.updatedAt }
}

export function getCachedConsumerStatus(): ConsumerStatusPage | null {
  return lastConsumer?.payload ?? null
}
