import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  resolveDeviceConnectionStatus,
  resolveDeviceFromRequest,
} from '@/lib/vault/device-connection'

export const runtime = 'nodejs'

/**
 * GET /api/vault/local-bridge-status
 * Legacy shape for older UI — delegates to device connection resolver (defaults to UA).
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
  const { deviceClass } = resolveDeviceFromRequest(ua, clientClass)
  const status = await resolveDeviceConnectionStatus(userId, deviceClass)

  const userMessage = status.layers.accessBridge.shortMessage

  return NextResponse.json(
    {
      bridgeOnline: status.bridgeOnline,
      lastSeenAt: status.lastSeenAt,
      devicePaired: status.devicePaired,
      localDev: status.localDev,
      canSyncWithoutBridge: status.canSyncWithoutBridge,
      statusLabel: status.bridgeOnline
        ? 'online'
        : status.localDev
          ? 'offline_dev'
          : 'offline',
      userMessage,
      startCommand: status.startCommand,
      setupDocPath: status.setupDocPath,
      deviceClass: status.deviceClass,
      deviceLabel: status.deviceLabel,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
