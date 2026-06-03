import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { listOpenJarvisTools } from '@/lib/actions/openjarvis-tools'

export const runtime = 'nodejs'

/** GET /api/jyson/openjarvis/tools — registry + runtime availability */
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await listOpenJarvisTools()
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
