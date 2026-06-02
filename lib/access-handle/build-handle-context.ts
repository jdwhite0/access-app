import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { createSupabaseAdmin } from '@/lib/supabase'
import { createDefaultFounderBlueprint, handleToFounderOsId } from '@/lib/blueprint/defaults'
import { rowToFounderBlueprint } from '@/lib/blueprint/from-row'
import { FOUNDER_OS_BLUEPRINT_TYPE } from '@/types/founder-blueprint'
import type { FounderBlueprintSpec } from '@/types/founder-blueprint'
import { KNOWN_HANDLE_FIXTURES, PRIMARY_TEST_HANDLE } from './constants'
import {
  inferUserTypeFromIds,
  resolveActionsForUserType,
} from './agent-policy'
import {
  loadPackageBlueprint,
  loadPackageRegistry,
  loadPackageVaultSeedSummaries,
  packagePathForHandle,
} from './package-loader'
import { buildConsumerSummary, buildTechnicalSummary } from './summaries'
import type { AccessHandleContext } from './types'
import { resolveAccessHandle } from './resolve-handle'

async function loadFixtureBlueprint(
  handle: string
): Promise<FounderBlueprintSpec | null> {
  const rel = KNOWN_HANDLE_FIXTURES[handle]
  if (!rel) return null
  try {
    const path = resolve(process.cwd(), rel)
    const raw = await readFile(path, 'utf8')
    return JSON.parse(raw) as FounderBlueprintSpec
  } catch {
    return null
  }
}

async function loadBlueprintFromSupabase(
  handle: string
): Promise<FounderBlueprintSpec | null> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return null

  const { data } = await supabase
    .from('blueprints')
    .select('*')
    .eq('owner_handle', handle)
    .eq('type', FOUNDER_OS_BLUEPRINT_TYPE)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null
  const row = rowToFounderBlueprint(data)
  return row?.answers ?? null
}

export async function buildAccessHandleContext(
  handleInput: string
): Promise<{ context: AccessHandleContext | null; error?: string }> {
  const resolved = resolveAccessHandle(handleInput)
  if (!resolved.valid) {
    return { context: null, error: resolved.error }
  }

  const handle = resolved.handle
  let blueprint: FounderBlueprintSpec | null = null
  let source: AccessHandleContext['source'] = 'default'
  let packagePath: string | null = null
  let registry = null
  let vaultSeedSummaries: AccessHandleContext['vaultSeedSummaries'] = []

  blueprint = await loadBlueprintFromSupabase(handle)
  if (blueprint) source = 'supabase'

  if (!blueprint) {
    const pkg = await loadPackageBlueprint(handle)
    if (pkg) {
      blueprint = pkg.spec
      packagePath = pkg.packagePath
      source = 'package'
      registry = await loadPackageRegistry(packagePath)
      vaultSeedSummaries = await loadPackageVaultSeedSummaries(packagePath)
    }
  }

  if (!blueprint) {
    const fixture = await loadFixtureBlueprint(handle)
    if (fixture) {
      blueprint = fixture
      source = 'fixture'
      packagePath = packagePathForHandle(handle)
      try {
        registry = await loadPackageRegistry(packagePath)
        vaultSeedSummaries = await loadPackageVaultSeedSummaries(packagePath)
      } catch {
        /* package may not exist yet */
      }
    }
  }

  if (!blueprint && handle === PRIMARY_TEST_HANDLE) {
    blueprint = createDefaultFounderBlueprint({
      accessHandle: handle,
      displayName: 'Jerry Devin White',
    })
    source = 'default'
  }

  if (!blueprint) {
    return { context: null, error: `No blueprint found for handle ${handle}` }
  }

  if (!packagePath) {
    packagePath = packagePathForHandle(handle)
    try {
      const { access } = await import('node:fs/promises')
      await access(join(packagePath, 'manifest.json'))
      if (!registry) registry = await loadPackageRegistry(packagePath)
      if (!vaultSeedSummaries.length) {
        vaultSeedSummaries = await loadPackageVaultSeedSummaries(packagePath)
      }
    } catch {
      packagePath = null
    }
  }

  const userSystemId = blueprint.output.founder_os_id ?? handleToFounderOsId(handle)
  const userType = inferUserTypeFromIds(userSystemId, blueprint.blueprint_id)
  const { allowed, denied } = resolveActionsForUserType(userType)

  const partial: Omit<AccessHandleContext, 'summaries'> = {
    accessHandle: handle,
    ownershipAnchor: handle,
    identity: {
      displayName: blueprint.founder.display_name,
      accessHandle: blueprint.founder.access_handle,
      userType,
    },
    blueprint,
    registry,
    vaultSeedSummaries,
    organizations: blueprint.organizations,
    products: blueprint.products,
    experiences: blueprint.experiences,
    userSystemId,
    userSystemPackagePath: packagePath,
    allowedActions: allowed,
    deniedActions: denied,
    source,
  }

  const context: AccessHandleContext = {
    ...partial,
    summaries: {
      consumer: buildConsumerSummary(partial),
      technical: buildTechnicalSummary(partial),
    },
  }

  return { context }
}

/** Build handle context from an in-memory blueprint (session / local / post-repair). */
export async function buildAccessHandleContextFromSpec(
  blueprint: FounderBlueprintSpec,
  options?: {
    source?: AccessHandleContext['source']
    packagePath?: string | null
  }
): Promise<AccessHandleContext> {
  const handle = blueprint.founder.access_handle
  let packagePath: string | null = options?.packagePath ?? packagePathForHandle(handle)
  let registry: AccessHandleContext['registry'] = null
  let vaultSeedSummaries: AccessHandleContext['vaultSeedSummaries'] = []
  const source = options?.source ?? 'supabase'

  try {
    const { access: accessFs } = await import('node:fs/promises')
    await accessFs(join(packagePath, 'manifest.json'))
    registry = await loadPackageRegistry(packagePath)
    vaultSeedSummaries = await loadPackageVaultSeedSummaries(packagePath)
  } catch {
    packagePath = null
  }

  const userSystemId = blueprint.output.founder_os_id ?? handleToFounderOsId(handle)
  const userType = inferUserTypeFromIds(userSystemId, blueprint.blueprint_id)
  const { allowed, denied } = resolveActionsForUserType(userType)

  const partial: Omit<AccessHandleContext, 'summaries'> = {
    accessHandle: handle,
    ownershipAnchor: handle,
    identity: {
      displayName: blueprint.founder.display_name,
      accessHandle: blueprint.founder.access_handle,
      userType,
    },
    blueprint,
    registry,
    vaultSeedSummaries,
    organizations: blueprint.organizations,
    products: blueprint.products,
    experiences: blueprint.experiences,
    userSystemId,
    userSystemPackagePath: packagePath,
    allowedActions: allowed,
    deniedActions: denied,
    source,
  }

  return {
    ...partial,
    summaries: {
      consumer: buildConsumerSummary(partial),
      technical: buildTechnicalSummary(partial),
    },
  }
}
