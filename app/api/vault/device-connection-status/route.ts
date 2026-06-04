import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  resolveDeviceConnectionStatus,
  resolveDeviceFromRequest,
} from '@/lib/vault/device-connection'

export const runtime = 'nodejs'

/**
 * GET /api/vault/device-connection-status
 * Layered device ↔ ACCESS ↔ vault ↔ JYSON status for Vaults UI.
 * Query: deviceClass (client hint). Headers: User-Agent, optional x-access-device-class.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientClass =
    req.nextUrl.searchParams.get('deviceClass') ??
    req.headers.get('x-access-device-class')
  const ua = req.headers.get('user-agent')
  const platformHint = req.headers.get('sec-ch-ua-platform')?.replace(/"/g, '')

  const { deviceClass } = resolveDeviceFromRequest(ua, clientClass, platformHint)
  const payload = await resolveDeviceConnectionStatus(userId, deviceClass)

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
