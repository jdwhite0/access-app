'use server'

/**
 * Hybrid cloud+local companion world resolver.
 *
 * Load order:
 *   1. Run world diagnostic (cloud gate → local upgrade)
 *   2. If cloud_package_ready or better → load context from Supabase blueprint
 *   3. Try local agent context upgrade if local_founder_os_ready or companion_ready
 *   4. Return JysonContext with companionState reflecting exact tier
 */
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
import {
  diagnosticForStatus,
  type CompanionDiagnosticStatus,
} from '@/lib/jyson-bridge/companion-diagnostic'
import { isConnectorOnlineForClerkUser } from '@/lib/connector/connector-online'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { JysonContext } from '@/lib/jyson-bridge/types'
import type { AccessHandleContext } from '@/lib/access-handle/types'
import type { FounderBlueprintSpec } from '@/types/founder-blueprint'

export type CompanionLoadResult = {
  context: JysonContext | null
  diagnostic: import('@/lib/jyson-bridge/companion-diagnostic').CompanionDiagnostic
  worldDiagnostics?: CompanionWorldDiagnostics
}

/** Statuses where the companion CAN load a context (cloud or local). */
const LOADABLE_STATUSES: ReadonlySet<CompanionDiagnosticStatus> = new Set([
  'cloud_package_ready',
  'local_sync_pending',
  'local_founder_os_ready',
  'companion_ready',
])

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

async function connectorOnlineForClerkUser(clerkUserId: string): Promise<boolean> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return false
  const state = await isConnectorOnlineForClerkUser(supabase, clerkUserId)
  return state.online
}

function accessToJysonContext(
  access: AccessHandleContext,
  agentContextLoaded: boolean,
  worldStatus: CompanionDiagnosticStatus,
  connectorOnline: boolean
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
    companionState: {
      status: worldStatus,
      cloudReady:
        worldStatus === 'cloud_package_ready' ||
        worldStatus === 'local_sync_pending' ||
        worldStatus === 'local_founder_os_ready' ||
        worldStatus === 'companion_ready',
      localConnected:
        worldStatus === 'local_founder_os_ready' || worldStatus === 'companion_ready',
      connectorOnline,
    },
  }
}

async function loadContextFromSpec(
  handle: string,
  spec: FounderBlueprintSpec,
  worldStatus: CompanionDiagnosticStatus,
  connectorOnline: boolean
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
    return {
      context: accessToJysonContext(access, false, worldStatus, connectorOnline),
      agentLoaded: false,
    }
  }
  const agent = await tryLoadAgentContext(packagePath)
  const finalStatus: CompanionDiagnosticStatus = agent.loaded
    ? 'companion_ready'
    : worldStatus
  return {
    context: accessToJysonContext(access, agent.loaded, finalStatus, connectorOnline),
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

export async function resolveCompanionWorld(): Promise<CompanionLoadResult> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { context: null, diagnostic: diagnosticForStatus('auth_missing') }
    }

    const world = await diagnoseCompanionWorld()
    const diag = enrichDiagnostic(world)

    // Only proceed to context loading if the world diagnostic says we can.
    if (!LOADABLE_STATUSES.has(world.diagnostic.status)) {
      return { context: null, diagnostic: diag, worldDiagnostics: world }
    }

    // Ensure identity exists (create if missing during repair flows)
    const derivedHandle = await deriveAccessHandleForSession()
    const { identity, error: identityError } = await getOrCreateIdentity(derivedHandle)
    if (!identity?.handle) {
      const d = diagnosticForStatus('identity_missing', {
        handle: derivedHandle,
        error: identityError,
      })
      return {
        context: null,
        diagnostic: {
          ...d,
          missingStep: 'ACCESS identity',
          recommendedFix: identityError ?? d.body,
        },
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
    const connectorOnline = await connectorOnlineForClerkUser(userId)
    const { context, agentLoaded, error: agentError } = await loadContextFromSpec(
      handle,
      blueprintResult.spec,
      world.diagnostic.status,
      connectorOnline
    )

    if (!context) {
      return { context: null, diagnostic: diag, worldDiagnostics: world }
    }

    // Context loaded — return with enriched diagnostic reflecting actual state
    const finalStatus: CompanionDiagnosticStatus = agentLoaded
      ? 'companion_ready'
      : world.diagnostic.status

    return {
      context,
      diagnostic: {
        ...diagnosticForStatus(finalStatus, {
          handle: context.handle,
          founderOsId: context.userSystemId,
          packagePath: context.userSystemPackagePath,
          error: agentLoaded ? undefined : agentError,
          cloudReady: true,
          localReady: agentLoaded || world.diagnostic.localReady,
          connectorOnline,
        }),
        missingStep: world.missingStep,
        recommendedFix: world.recommendedFix,
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
          body: 'Clerk proxy is missing or the dev server needs a restart.',
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
