'use server'

import { auth } from '@clerk/nextjs/server'
import {
  buildAccessHandleContext,
  buildAccessHandleContextFromSpec,
} from '@/lib/access-handle/build-handle-context'
import { packagePathForHandle } from '@/lib/access-handle/package-loader'
import { getOrCreateIdentity } from '@/lib/actions/identity'
import { getOrCreateFounderBlueprint } from '@/lib/actions/founder-blueprint'
import { deriveAccessHandleForSession } from '@/lib/jyson-bridge/companion-handle'
import {
  diagnoseCompanionWorld,
  type CompanionWorldDiagnostics,
} from '@/lib/jyson-bridge/companion-world-diagnostic'
import { diagnosticForStatus } from '@/lib/jyson-bridge/companion-diagnostic'
import type { JysonContext } from '@/lib/jyson-bridge/types'
import type { AccessHandleContext } from '@/lib/access-handle/types'
import type { FounderBlueprintSpec } from '@/types/founder-blueprint'

export type CompanionLoadResult = {
  context: JysonContext | null
  diagnostic: import('@/lib/jyson-bridge/companion-diagnostic').CompanionDiagnostic
  worldDiagnostics?: CompanionWorldDiagnostics
}

async function tryLoadAgentContext(
  packagePath: string
): Promise<{ loaded: boolean; error?: string }> {
  try {
    const { loadJysonRuntimeModules } = await import('@/lib/jyson-bridge/jyson-runtime-loader')
    const { buildAgentContext } = await loadJysonRuntimeModules()
    await buildAgentContext(packagePath)
    return { loaded: true }
  } catch (e) {
    return { loaded: false, error: e instanceof Error ? e.message : String(e) }
  }
}

function accessToJysonContext(
  access: AccessHandleContext,
  agentContextLoaded: boolean
): JysonContext {
  return {
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
      agentContext: agentContextLoaded,
    },
  }
}

async function loadContextFromSpec(
  handle: string,
  spec: FounderBlueprintSpec
): Promise<{ context: JysonContext | null; agentLoaded: boolean; error?: string }> {
  const built = await buildAccessHandleContext(handle)
  let access = built.context
  if (!access) {
    access = await buildAccessHandleContextFromSpec(spec, {
      source: 'supabase',
      packagePath: packagePathForHandle(handle),
    })
  }
  const packagePath = access.userSystemPackagePath
  if (!packagePath) {
    return { context: accessToJysonContext(access, false), agentLoaded: false }
  }
  const agent = await tryLoadAgentContext(packagePath)
  return {
    context: accessToJysonContext(access, agent.loaded),
    agentLoaded: agent.loaded,
    error: agent.error,
  }
}

function enrichDiagnostic(
  world: CompanionWorldDiagnostics
): CompanionLoadResult['diagnostic'] {
  return {
    ...world.diagnostic,
    missingStep: world.missingStep,
    recommendedFix: world.recommendedFix,
  }
}

/**
 * Full companion load: identity → blueprint → package → AgentContext → JysonContext.
 */
export async function resolveCompanionWorld(): Promise<CompanionLoadResult> {
  try {
    const { userId } = await auth()
    if (!userId) {
      const d = diagnosticForStatus('auth_missing')
      return { context: null, diagnostic: d }
    }

    const world = await diagnoseCompanionWorld()
    const diag = enrichDiagnostic(world)

    if (
      world.diagnostic.status !== 'ready' &&
      world.diagnostic.status !== 'missing_agent_context'
    ) {
      return { context: null, diagnostic: diag, worldDiagnostics: world }
    }

    const derivedHandle = await deriveAccessHandleForSession()
    const { identity, error: identityError } = await getOrCreateIdentity(derivedHandle)
    if (!identity?.handle) {
      const d = diagnosticForStatus('missing_identity', {
        handle: derivedHandle,
        error: identityError,
      })
      return {
        context: null,
        diagnostic: { ...d, missingStep: 'ACCESS identity', recommendedFix: identityError ?? d.body },
        worldDiagnostics: world,
      }
    }

    const blueprintResult = await getOrCreateFounderBlueprint()
    if (!blueprintResult?.spec) {
      return {
        context: null,
        diagnostic: enrichDiagnostic(await diagnoseCompanionWorld()),
        worldDiagnostics: world,
      }
    }

    const handle = blueprintResult.spec.founder.access_handle
    const { context, agentLoaded, error: agentError } = await loadContextFromSpec(
      handle,
      blueprintResult.spec
    )

    if (!context) {
      return {
        context: null,
        diagnostic: diag,
        worldDiagnostics: world,
      }
    }

    if (!agentLoaded && world.diagnostic.status === 'missing_agent_context') {
      return {
        context,
        diagnostic: {
          ...diag,
          message: agentError ?? diag.message,
        },
        worldDiagnostics: world,
      }
    }

    if (!agentLoaded) {
      return {
        context,
        diagnostic: {
          ...diagnosticForStatus('missing_agent_context', {
            handle,
            founderOsId: context.userSystemId,
            packagePath: context.userSystemPackagePath,
            error: agentError,
          }),
          missingStep: world.missingStep,
          recommendedFix: world.recommendedFix,
        },
        worldDiagnostics: world,
      }
    }

    return {
      context,
      diagnostic: {
        ...diagnosticForStatus('ready', {
          handle: context.handle,
          founderOsId: context.userSystemId,
          packagePath: context.userSystemPackagePath,
        }),
        agentContextLoaded: true,
      },
      worldDiagnostics: world,
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (
      message.includes('clerkMiddleware') ||
      message.includes('auth-middleware') ||
      message.includes('auth_signature_invalid')
    ) {
      return {
        context: null,
        diagnostic: {
          ...diagnosticForStatus('auth_missing'),
          message,
          body: 'Clerk proxy is missing or the dev server needs a restart (access-app/proxy.ts).',
          canRepair: false,
        },
      }
    }
    const world = await diagnoseCompanionWorld().catch(() => null)
    return {
      context: null,
      diagnostic: world
        ? enrichDiagnostic(world)
        : diagnosticForStatus('unknown_error', { error: message }),
      worldDiagnostics: world ?? undefined,
    }
  }
}
