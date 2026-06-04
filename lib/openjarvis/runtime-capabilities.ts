import {
  resolveJysonCapabilitySnapshot,
  type JysonCapabilitySnapshot,
} from '@/lib/openjarvis/jyson-capabilities'
import type { OpenJarvisRuntimeState } from '@/lib/openjarvis/resolve-runtime-state'

export type IntelligenceTier = 'full' | 'cloud' | 'local-partial'

export type IntelligenceRecommendedAction =
  | 'none'
  | 'enable_private'
  | 'start_openjarvis'
  | 'pair_connector'

export type IntelligenceCapabilities = {
  vaultChat: boolean
  localTools: boolean
  connector: boolean
  cloudChat: boolean
  tier: IntelligenceTier
  /** Local setup not required (cloud) or execution layer is up. */
  setupComplete: boolean
  recommendedAction: IntelligenceRecommendedAction
  /** Hide setup CTAs — full tools or local runtime reachable. */
  localIntelligenceActive: boolean
  /** User-facing JYSON capability statuses (not OpenJarvis tool names). */
  jysonCapabilities: JysonCapabilitySnapshot
}

export type IntelligenceSessionContext = {
  /** Vault indexed / cloud metadata available for chat excerpts. */
  vaultCloudReady?: boolean
}

/** OpenJarvis HTTP up on founder machine (may still need connector for full tools). */
export function isLocalIntelligenceActive(runtime: OpenJarvisRuntimeState): boolean {
  if (runtime.localToolsAvailable) return true
  return runtime.deploymentMode === 'local' && runtime.openJarvisOnline
}

export function resolveRecommendedAction(
  runtime: OpenJarvisRuntimeState,
): IntelligenceRecommendedAction {
  if (runtime.deploymentMode === 'cloud' || runtime.localToolsAvailable) {
    return 'none'
  }
  if (!runtime.privateLayerEnabled) return 'enable_private'
  if (!runtime.openJarvisInstalled) return 'start_openjarvis'
  if (!runtime.openJarvisOnline) return 'start_openjarvis'
  if (!runtime.connectorOnline) return 'pair_connector'
  return 'none'
}

export function resolveIntelligenceCapabilities(
  runtime: OpenJarvisRuntimeState,
  session: IntelligenceSessionContext = {},
): IntelligenceCapabilities {
  const vaultCloudReady = session.vaultCloudReady !== false
  const localTools = runtime.localToolsAvailable
  const connector = runtime.connectorOnline
  const cloudChat = true
  const localIntelligenceActive = isLocalIntelligenceActive(runtime)

  let tier: IntelligenceTier
  if (runtime.deploymentMode === 'cloud') {
    tier = vaultCloudReady ? 'full' : 'cloud'
  } else if (localTools) {
    tier = 'full'
  } else if (localIntelligenceActive) {
    tier = 'local-partial'
  } else {
    tier = 'cloud'
  }

  const setupComplete =
    runtime.deploymentMode === 'cloud' || localTools || localIntelligenceActive

  const recommendedAction = resolveRecommendedAction(runtime)

  const jysonCapabilities = resolveJysonCapabilitySnapshot(runtime, null, session)

  return {
    vaultChat: vaultCloudReady,
    localTools,
    connector,
    cloudChat,
    tier,
    setupComplete,
    recommendedAction,
    localIntelligenceActive,
    jysonCapabilities,
  }
}
