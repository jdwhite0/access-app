import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { executeOpenJarvisTool } from '@/lib/actions/openjarvis-tools'
import type { ToolId } from '@/lib/openjarvis/load-bridge'

export const runtime = 'nodejs'

/**
 * POST /api/jyson/openjarvis/execute
 * Body: { toolId, params, userConfirmed? }
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { toolId?: ToolId; params?: Record<string, unknown>; userConfirmed?: boolean }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.toolId || typeof body.toolId !== 'string') {
    return NextResponse.json({ error: 'toolId required' }, { status: 400 })
  }

  const result = await executeOpenJarvisTool({
    toolId: body.toolId,
    params: body.params ?? {},
    userConfirmed: body.userConfirmed,
  })

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
