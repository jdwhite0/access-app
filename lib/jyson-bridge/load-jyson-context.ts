'use server'

/**
 * ACCESS-side read-only JYSON context (P8).
 * Full AgentContext layer requires monorepo package on disk — see jyson loadJysonContextFromAccessHandle.
 */
import { buildAccessHandleContext } from '@/lib/access-handle/build-handle-context'
import { PRIMARY_TEST_HANDLE } from '@/lib/access-handle/constants'
import { resolveCompanionWorld } from '@/lib/jyson-bridge/resolve-companion-world'
import type { JysonContext } from './types'

export type { JysonContext } from './types'

export async function loadJysonContextFromAccessHandle(
  handleInput: string
): Promise<{ context: JysonContext | null; error?: string }> {
  const { context: access, error } = await buildAccessHandleContext(handleInput)
  if (!access) return { context: null, error }

  const jysonContext: JysonContext = {
    handle: access.ownershipAnchor,
    identity: {
      displayName: access.identity.displayName,
      accessHandle: access.identity.accessHandle,
      userType: access.identity.userType,
    },
    organizations: access.organizations,
    products: access.products,
    experiences: access.experiences,
    registry: access.registry as Record<string, unknown> | null,
    vaultSeeds: access.vaultSeedSummaries,
    permissions: {
      allowed: [...access.allowedActions],
      denied: [...access.deniedActions],
    },
    allowedActions: [...access.allowedActions],
    deniedActions: [...access.deniedActions],
    summary: {
      consumer: access.summaries.consumer,
      technical: access.summaries.technical,
      headline:
        'JYSON is operating as your ACCESS companion — reading your digital world from your handle.',
    },
    userSystemId: access.userSystemId,
    userSystemPackagePath: access.userSystemPackagePath,
    layers: {
      accessHandleContext: true,
      agentContext: false,
    },
  }

  return { context: jysonContext }
}

/** Load companion context for the signed-in user (identity → blueprint → package → AgentContext). */
export async function loadJysonContextForSession(): Promise<{
  context: JysonContext | null
  error?: string
  diagnostic?: Awaited<ReturnType<typeof resolveCompanionWorld>>['diagnostic']
  worldDiagnostics?: Awaited<ReturnType<typeof resolveCompanionWorld>>['worldDiagnostics']
}> {
  const result = await resolveCompanionWorld()
  if (result.context) {
    return {
      context: result.context,
      diagnostic: result.diagnostic,
      worldDiagnostics: result.worldDiagnostics,
    }
  }
  return {
    context: null,
    error: result.diagnostic.message,
    diagnostic: result.diagnostic,
    worldDiagnostics: result.worldDiagnostics,
  }
}
