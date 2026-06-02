import { NextRequest, NextResponse } from 'next/server'
import { verifyInternalKey } from '@/lib/platform-api/auth'
import { buildAndPublishStatusBundle } from '@/lib/status-page/build-and-publish'
import { projectStatusPage, type StatusPageAudience } from '@/lib/status-page/project-audience-view'

/**
 * Internal Platform Health API (legacy audience param).
 * Prefer GET /api/platform/status and /api/platform/status/{operator|developer}.
 *
 * GET /api/internal/platform-health?audience=operator|developer|consumer
 */
export async function GET(request: NextRequest) {
  const denied = verifyInternalKey(request)
  if (denied) return denied

  const audienceParam = request.nextUrl.searchParams.get('audience') ?? 'operator'
  const audience: StatusPageAudience =
    audienceParam === 'developer'
      ? 'developer'
      : audienceParam === 'consumer'
        ? 'consumer'
        : 'operator'

  const bundle = buildAndPublishStatusBundle()
  const payload = projectStatusPage(audience, bundle)

  const cache =
    audience === 'consumer'
      ? { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' }
      : { 'Cache-Control': 'private, no-store' }

  return NextResponse.json(payload, { headers: cache })
}
