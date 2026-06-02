import { NextRequest, NextResponse } from 'next/server'
import { verifyInternalKey } from '@/lib/platform-api/auth'
import { buildAndPublishStatusBundle } from '@/lib/status-page/build-and-publish'
import { toCommandCenterApiResponse } from '@/lib/command-center/build-bundle'

/**
 * Internal Command Center API — operator only.
 * GET /api/internal/command-center
 */
export async function GET(request: NextRequest) {
  const denied = verifyInternalKey(request)
  if (denied) return denied

  const bundle = buildAndPublishStatusBundle()
  return NextResponse.json(toCommandCenterApiResponse(bundle))
}
