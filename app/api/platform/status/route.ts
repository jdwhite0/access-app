import { NextResponse } from 'next/server'
import { buildAndPublishStatusBundle } from '@/lib/status-page/build-and-publish'
import { getCachedConsumerStatus } from '@/lib/status-page/consumer-cache'
import { projectConsumerStatus } from '@/lib/status-page/project-audience-view'

/**
 * Public consumer status — projected from Command Center bundle.
 * GET /api/platform/status
 */
export async function GET() {
  let payload = getCachedConsumerStatus()
  if (!payload) {
    const bundle = buildAndPublishStatusBundle()
    payload = projectConsumerStatus(bundle)
  }

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    },
  })
}
