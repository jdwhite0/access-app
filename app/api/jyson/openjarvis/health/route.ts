import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { resolveOpenJarvisRuntimeState } from '@/lib/openjarvis/resolve-runtime-state'

export const runtime = 'nodejs'

/**
 * GET /api/jyson/openjarvis/health
 * Real connector heartbeat + OpenJarvis /health (local dev only).
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const state = await resolveOpenJarvisRuntimeState()
  return NextResponse.json(state, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
