'use server'

import { auth } from '@clerk/nextjs/server'
import { isConnectorOnlineForClerkUser } from '@/lib/connector/connector-online'
import { createSupabaseAdmin } from '@/lib/supabase'
import { detectOpenJarvisInstall } from '@/lib/openjarvis/detect-setup'
import { buildOpenJarvisStatusMessage } from '@/lib/openjarvis/runtime-messages'
import {
  checkOpenJarvisHealth,
  isPrivateJysonEnabled,
} from '@/lib/openjarvis/load-bridge'

export type OpenJarvisRuntimeState = {
  /** `cloud` on Vercel; `local` on founder machine. */
  deploymentMode: 'cloud' | 'local'
  connectorOnline: boolean
  connectorLastSeenAt: string | null
  openJarvisOnline: boolean
  openJarvisVersion?: string
  privateLayerEnabled: boolean
  /** Private layer + connector heartbeat + OpenJarvis /health + install. */
  localToolsAvailable: boolean
  /** read_file / list_files via native ToolRegistry when localToolsAvailable. */
  mappedToolsReady: boolean
  openJarvisInstalled: boolean
  openJarvisLocalUrl: string
  setupHint?: string
  message?: string
}

export async function resolveOpenJarvisRuntimeState(): Promise<OpenJarvisRuntimeState> {
  const deploymentMode: 'cloud' | 'local' = process.env.VERCEL === '1' ? 'cloud' : 'local'
  const privateLayerEnabled = isPrivateJysonEnabled()
  const install = detectOpenJarvisInstall()
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
  let healthError: string | undefined

  if (privateLayerEnabled) {
    const health = await checkOpenJarvisHealth()
    openJarvisOnline = health.online
    openJarvisVersion = health.version
    healthError = health.error
  }

  const localToolsAvailable =
    privateLayerEnabled && connectorOnline && openJarvisOnline && install.installed
  const mappedToolsReady = localToolsAvailable

  const message = buildOpenJarvisStatusMessage({
    deploymentMode,
    privateLayerEnabled,
    install,
    openJarvisOnline,
    connectorOnline,
    healthError,
  })

  const setupHint = !install.installed
    ? `Install OpenJarvis — ${install.docsPath}`
    : !privateLayerEnabled && deploymentMode === 'local'
      ? 'Set PRIVATE_JYSON_ENABLED=true in access-app/.env.local and restart npm run dev'
      : !openJarvisOnline && privateLayerEnabled
        ? install.startCommand
        : privateLayerEnabled && openJarvisOnline && !connectorOnline
          ? 'npm run connector:heartbeat'
          : undefined

  return {
    deploymentMode,
    connectorOnline,
    connectorLastSeenAt,
    openJarvisOnline,
    openJarvisVersion,
    privateLayerEnabled,
    localToolsAvailable,
    mappedToolsReady,
    openJarvisInstalled: install.installed,
    openJarvisLocalUrl: install.localUrl,
    setupHint,
    message,
  }
}
