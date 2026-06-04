'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchOpenJarvisHealth } from '@/lib/openjarvis/fetch-health-client'
import { markLocalToolsActivated, readLocalToolsActivatedHint } from '@/lib/openjarvis/local-tools-activation'
import type { IntelligenceCapabilities } from '@/lib/openjarvis/runtime-capabilities'
import type { OpenJarvisRuntimeState } from '@/lib/openjarvis/resolve-runtime-state'

const DEFAULT_POLL_MS = 30_000

export type UseOpenJarvisHealthOptions = {
  /** Poll interval while mounted (default 30s). */
  pollIntervalMs?: number
  /** Re-fetch on window focus / tab visible (default true). */
  pollOnFocus?: boolean
}

export function useOpenJarvisHealth(options: UseOpenJarvisHealthOptions = {}) {
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_MS
  const pollOnFocus = options.pollOnFocus !== false

  const [runtime, setRuntime] = useState<OpenJarvisRuntimeState | null>(null)
  const [capabilities, setCapabilities] = useState<IntelligenceCapabilities | null>(null)
  const [loading, setLoading] = useState(true)
  const [activationHint] = useState(() => readLocalToolsActivatedHint())

  const applyHealth = useCallback(
    (health: Awaited<ReturnType<typeof fetchOpenJarvisHealth>>) => {
      if (!health) return null
      setRuntime(health.runtime)
      setCapabilities(health.capabilities)
      if (health.capabilities.localIntelligenceActive || health.capabilities.localTools) {
        markLocalToolsActivated()
      }
      return health
    },
    [],
  )

  const refresh = useCallback(async () => {
    const health = await fetchOpenJarvisHealth()
    applyHealth(health)
    setLoading(false)
    return health
  }, [applyHealth])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const id = window.setInterval(() => void refresh(), pollIntervalMs)
    return () => window.clearInterval(id)
  }, [refresh, pollIntervalMs])

  useEffect(() => {
    if (!pollOnFocus) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh, pollOnFocus])

  const ui = useMemo(() => {
    const fileToolsLive = capabilities?.localTools ?? false
    const localIntelligenceActive =
      capabilities?.localIntelligenceActive ?? activationHint
    const setupComplete = capabilities?.setupComplete ?? activationHint
    const showSetupCta =
      capabilities &&
      !setupComplete &&
      !localIntelligenceActive &&
      runtime?.deploymentMode !== 'cloud'
    return {
      fileToolsLive,
      localIntelligenceActive,
      setupComplete,
      showSetupCta: showSetupCta === true,
      connectedBadge: localIntelligenceActive || fileToolsLive || activationHint,
    }
  }, [capabilities, activationHint, runtime?.deploymentMode])

  return {
    runtime,
    capabilities,
    loading,
    refresh,
    ...ui,
  }
}
