import type { IntelligenceCapabilities } from '@/lib/openjarvis/runtime-capabilities'
import type { OpenJarvisRuntimeState } from '@/lib/openjarvis/resolve-runtime-state'

export type OpenJarvisHealthResponse = {
  runtime: OpenJarvisRuntimeState
  capabilities: IntelligenceCapabilities
  localToolsAvailable: boolean
  setupComplete: boolean
  recommendedAction: IntelligenceCapabilities['recommendedAction']
}

export async function fetchOpenJarvisHealth(): Promise<OpenJarvisHealthResponse | null> {
  try {
    const res = await fetch('/api/jyson/openjarvis/health', { cache: 'no-store' })
    if (!res.ok) return null
    const d = (await res.json()) as OpenJarvisHealthResponse & {
      runtime?: OpenJarvisRuntimeState
      capabilities?: IntelligenceCapabilities
    }
    const runtime = d.runtime ?? (d as unknown as OpenJarvisRuntimeState)
    const capabilities = d.capabilities
    if (!capabilities) return null
    return {
      runtime,
      capabilities,
      localToolsAvailable: d.localToolsAvailable ?? runtime.localToolsAvailable,
      setupComplete: d.setupComplete ?? capabilities.setupComplete,
      recommendedAction: d.recommendedAction ?? capabilities.recommendedAction,
    }
  } catch {
    return null
  }
}
