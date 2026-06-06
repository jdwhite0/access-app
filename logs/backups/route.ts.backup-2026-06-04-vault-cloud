import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { resolveIntelligenceCapabilities } from '@/lib/openjarvis/runtime-capabilities'
import { resolveOpenJarvisRuntimeState } from '@/lib/openjarvis/resolve-runtime-state'

export const runtime = 'nodejs'

/**
 * GET /api/jyson/openjarvis/health
 * Private JYSON + OpenJarvis GET /health (+ connector status for sync, not for gating tools).
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const runtime = await resolveOpenJarvisRuntimeState()
  const capabilities = resolveIntelligenceCapabilities(runtime)
  return NextResponse.json(
    {
      ...runtime,
      runtime,
      capabilities,
      localToolsAvailable: runtime.localToolsAvailable,
      setupComplete: capabilities.setupComplete,
      recommendedAction: capabilities.recommendedAction,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
