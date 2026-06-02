import { NextResponse } from 'next/server'
import { requireClerkEngineering } from '@/lib/platform-api/auth'
import { buildCommandCenterBundle } from '@/lib/command-center/build-bundle'
import { projectDeveloperStatus } from '@/lib/status-page/project-audience-view'

/**
 * Developer status — full technical projection + recommendations for debug.
 * GET /api/platform/status/developer
 */
export async function GET() {
  const authResult = await requireClerkEngineering()
  if (!authResult.ok) return authResult.response

  const bundle = buildCommandCenterBundle()
  return NextResponse.json(projectDeveloperStatus(bundle), {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
