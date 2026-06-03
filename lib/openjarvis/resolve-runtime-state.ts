'use server'

import { auth } from '@clerk/nextjs/server'
import { isConnectorOnlineForClerkUser } from '@/lib/connector/connector-online'
import { createSupabaseAdmin } from '@/lib/supabase'
import {
  checkOpenJarvisHealth,
  isPrivateJysonEnabled,
} from '@/lib/openjarvis/load-bridge'

export type OpenJarvisRuntimeState = {
  connectorOnline: boolean
  connectorLastSeenAt: string | null
  openJarvisOnline: boolean
  openJarvisVersion?: string
  privateLayerEnabled: boolean
  localToolsAvailable: boolean
  message?: string
}

export async function resolveOpenJarvisRuntimeState(): Promise<OpenJarvisRuntimeState> {
  const privateLayerEnabled = isPrivateJysonEnabled()
  const { userId } = await auth()

  let connectorOnline = false
  let connectorLastSeenAt: string | null = null

  const supabase = createSupabaseAdmin()
  if (supabase && userId) {
    const connector = await isConnectorOnlineForClerkUser(supabase, userId)
    connectorOnline = connector.online
    connectorLastSeenAt = connector.lastSeenAt
  }

  let openJarvisOnline = false
  let openJarvisVersion: string | undefined
  let message: string | undefined

  if (!privateLayerEnabled) {
    message = 'Cloud mode — local OpenJarvis tools disabled.'
  } else if (!connectorOnline) {
    message = 'ACCESS connector offline — start the local connector and heartbeat.'
  } else {
    const health = await checkOpenJarvisHealth()
    openJarvisOnline = health.online
    openJarvisVersion = health.version
    if (!health.online) {
      message = health.error ?? 'OpenJarvis server not reachable.'
    }
  }

  const localToolsAvailable =
    privateLayerEnabled && connectorOnline && openJarvisOnline

  return {
    connectorOnline,
    connectorLastSeenAt,
    openJarvisOnline,
    openJarvisVersion,
    privateLayerEnabled,
    localToolsAvailable,
    message,
  }
}
