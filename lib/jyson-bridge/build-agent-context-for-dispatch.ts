import { access } from 'node:fs/promises'
import { buildAccessHandleContext } from '@/lib/access-handle/build-handle-context'
import {
  buildExecutionSurfaces,
  resolveActionsForUserType,
} from '@/lib/access-handle/agent-policy'
import { packagePathForHandle } from '@/lib/access-handle/package-loader'
import type { AccessHandleContext } from '@/lib/access-handle/types'
import { loadJysonRuntimeModules } from './jyson-runtime-loader'

/** Serializable subset of P7 DispatchDecision for the companion UI. */
export type CompanionDispatchDecision = {
  intent: string
  destination: string
  confidence: number
  allowed: boolean
  reason: string
  userMessage: string
  commandLabel: string
}

type AgentContextLike = {
  packagePath: string
  userSystemPackagePath: string
  userSystemId: string
  userSystemName: string
  userIdentity: {
    displayName: string
    accessHandle: string
    userType: string
  }
  digitalBlueprint: {
    blueprintId: string
    schemaVersion: string
    blueprintVersion: number
    status: string
  }
  accessHandle: string
  organizations: AccessHandleContext['organizations']
  products: AccessHandleContext['products']
  experiences: AccessHandleContext['experiences']
  registry: Record<string, unknown>
  vaultSeeds: Array<{
    type: 'organization' | 'product' | 'experience'
    id: string
    name: string
    path: string
    content: string
    metadata: Record<string, string>
  }>
  manifest: Record<string, unknown>
  founderContext: Record<string, unknown>
  allowedActions: string[]
  deniedActions: string[]
  executionSurfaces: ReturnType<typeof buildExecutionSurfaces>
  summaries: { consumer: string; technical: string }
}

function agentContextFromHandle(access: AccessHandleContext): AgentContextLike {
  const userType = access.identity.userType
  const { allowed, denied } = resolveActionsForUserType(userType)
  const packagePath =
    access.userSystemPackagePath ?? packagePathForHandle(access.accessHandle)
  const bp = access.blueprint

  const manifest = {
    package_version: '1.0.0-mvp',
    schema_version: bp.schema_version,
    blueprint_id: bp.blueprint_id,
    blueprint_version: bp.blueprint_version ?? 1,
    founder_os_id: access.userSystemId,
    founder_os_name: bp.output?.name ?? 'User System',
    founder_handle: access.accessHandle,
    founder_display_name: access.identity.displayName,
    materialized_at: new Date().toISOString(),
    source_file: null,
    counts: {
      organizations: access.organizations.length,
      products: access.products.length,
      experiences: access.experiences.length,
    },
  }

  const vaultSeeds = access.vaultSeedSummaries.map((s) => ({
    type: s.type,
    id: s.id,
    name: s.name,
    path: s.path,
    content: '',
    metadata: {},
  }))

  const founderContext = {
    founderOsId: access.userSystemId,
    founderOsName: manifest.founder_os_name,
    packagePath,
    manifest,
    registry: access.registry ?? {},
    founder: {
      display_name: access.identity.displayName,
      access_handle: access.accessHandle,
    },
    organizations: access.organizations,
    products: access.products,
    experiences: access.experiences,
    relationships: [],
    vaultSeeds,
  }

  return {
    packagePath,
    userSystemPackagePath: packagePath,
    userSystemId: access.userSystemId,
    userSystemName: manifest.founder_os_name as string,
    userIdentity: {
      displayName: access.identity.displayName,
      accessHandle: access.accessHandle,
      userType,
    },
    digitalBlueprint: {
      blueprintId: bp.blueprint_id,
      schemaVersion: bp.schema_version,
      blueprintVersion: bp.blueprint_version ?? 1,
      status: bp.status ?? 'unknown',
    },
    accessHandle: access.accessHandle,
    organizations: access.organizations,
    products: access.products,
    experiences: access.experiences,
    registry: (access.registry ?? {}) as Record<string, unknown>,
    vaultSeeds,
    manifest,
    founderContext,
    allowedActions: allowed,
    deniedActions: denied,
    executionSurfaces: buildExecutionSurfaces(userType),
    summaries: access.summaries,
  }
}

export async function resolveAgentContextForHandle(
  handle: string
): Promise<{ context: AgentContextLike | null; error?: string }> {
  const { context: access, error } = await buildAccessHandleContext(handle)
  if (!access) return { context: null, error }

  const packagePath =
    access.userSystemPackagePath ?? packagePathForHandle(access.accessHandle)

  try {
    await accessFs(packagePath)
    const { buildAgentContext } = await loadJysonRuntimeModules()
    const agent = await buildAgentContext(packagePath)
    return { context: agent as unknown as AgentContextLike }
  } catch {
    return { context: agentContextFromHandle(access) }
  }
}

async function accessFs(path: string): Promise<void> {
  await access(path)
}
