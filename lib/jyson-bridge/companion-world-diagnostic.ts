import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { auth } from '@clerk/nextjs/server'
import { handleToFounderOsId } from '@/lib/blueprint/defaults'
import { validateFounderBlueprint } from '@/lib/blueprint/validate-mvp'
import { packagePathForHandle } from '@/lib/access-handle/package-loader'
import { getIdentity, getOrCreateIdentity } from '@/lib/actions/identity'
import { getFounderBlueprint, getOrCreateFounderBlueprint } from '@/lib/actions/founder-blueprint'
import { isSupabaseConfigured } from '@/lib/supabase'
import { deriveAccessHandleForSession } from '@/lib/jyson-bridge/companion-handle'
import {
  diagnosticForStatus,
  type CompanionDiagnostic,
  type CompanionDiagnosticStatus,
} from '@/lib/jyson-bridge/companion-diagnostic'

export type DiagnosticCheck = {
  id: string
  label: string
  ok: boolean
  detail: string
}

export type CompanionWorldDiagnostics = {
  checks: DiagnosticCheck[]
  missingStep: string
  recommendedFix: string
  diagnostic: CompanionDiagnostic
}

function clerkConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  )
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

function push(checks: DiagnosticCheck[], id: string, label: string, ok: boolean, detail: string) {
  checks.push({ id, label, ok, detail })
}

/**
 * Deep diagnostic pass for companion load (no side effects except getOrCreate on repair flows).
 */
export async function diagnoseCompanionWorld(options?: {
  ensureIdentity?: boolean
}): Promise<CompanionWorldDiagnostics> {
  const checks: DiagnosticCheck[] = []
  let status: CompanionDiagnosticStatus = 'ready'
  let statusDetail: Parameters<typeof diagnosticForStatus>[1] = {}

  push(
    checks,
    'clerk_env',
    'Clerk environment',
    clerkConfigured(),
    clerkConfigured()
      ? 'Publishable + secret keys present'
      : 'Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY or CLERK_SECRET_KEY'
  )
  if (!clerkConfigured()) status = 'unknown_error'

  push(
    checks,
    'supabase_env',
    'Supabase (canonical store)',
    isSupabaseConfigured(),
    isSupabaseConfigured()
      ? 'Service role configured — blueprint rows persist'
      : 'No Supabase — local/ephemeral blueprint only (dev mode)'
  )

  let userId: string | null = null
  try {
    const authResult = await auth()
    userId = authResult.userId
    push(
      checks,
      'auth',
      'Authenticated user',
      !!userId,
      userId ? `Clerk user ${userId.slice(0, 8)}…` : 'No Clerk session'
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    push(checks, 'auth', 'Authenticated user', false, msg)
    status = 'auth_missing'
    statusDetail = { error: msg }
  }

  if (!userId) {
    return finalize(checks, status, statusDetail)
  }

  const derivedHandle = await deriveAccessHandleForSession()
  push(
    checks,
    'derived_handle',
    'Derived ACCESS handle',
    !!derivedHandle,
    derivedHandle || 'Could not derive from Clerk profile'
  )

  let identity = await getIdentity()
  if (!identity?.handle && options?.ensureIdentity) {
    const created = await getOrCreateIdentity(derivedHandle)
    identity = created.identity
    if (created.error) {
      push(checks, 'identity', 'ACCESS identity', false, created.error)
      status = 'missing_identity'
      statusDetail = { handle: derivedHandle, error: created.error }
      return finalize(checks, status, statusDetail)
    }
  }

  push(
    checks,
    'identity',
    'ACCESS identity',
    !!identity?.handle,
    identity?.handle
      ? `Linked handle ${identity.handle}`
      : 'No access_identities row for this Clerk user'
  )
  if (!identity?.handle) {
    status = 'missing_identity'
    statusDetail = { handle: derivedHandle }
    return finalize(checks, status, statusDetail)
  }

  const handle = identity.handle
  statusDetail.handle = handle

  if (derivedHandle && derivedHandle !== handle) {
    push(
      checks,
      'handle_match',
      'Clerk profile vs saved handle',
      false,
      `Profile suggests ${derivedHandle}, identity has ${handle}`
    )
    if (status === 'ready') status = 'unknown_error'
    statusDetail.error = 'ACCESS handle mismatch with current Clerk profile'
  } else {
    push(
      checks,
      'handle_match',
      'Clerk profile vs saved handle',
      true,
      handle
    )
  }

  const blueprintRow = await getFounderBlueprint()
  push(
    checks,
    'blueprint_row',
    'Blueprint row',
    !!blueprintRow?.spec,
    blueprintRow?.spec
      ? `Blueprint ${blueprintRow.spec.blueprint_id}`
      : isSupabaseConfigured()
        ? 'No blueprints row for this user'
        : 'No in-memory blueprint — run repair to create'
  )

  if (!blueprintRow?.spec) {
    status = 'missing_blueprint'
    return finalize(checks, status, statusDetail)
  }

  const spec = blueprintRow.spec
  const validation = await validateFounderBlueprint(spec)
  push(
    checks,
    'blueprint_valid',
    'Blueprint answers valid',
    validation.valid,
    validation.valid ? 'Schema validation passed' : validation.errors.join('; ')
  )
  if (!validation.valid) {
    status = 'unknown_error'
    statusDetail.error = validation.errors[0] ?? 'Invalid blueprint'
    return finalize(checks, status, statusDetail)
  }

  const founderHandle = spec.founder?.access_handle
  push(
    checks,
    'blueprint_handle',
    'Blueprint ACCESS handle',
    !!founderHandle,
    founderHandle ?? 'founder.access_handle missing'
  )

  if (founderHandle && founderHandle !== handle) {
    push(
      checks,
      'handle_blueprint_sync',
      'Identity ↔ blueprint handle',
      false,
      `Identity ${handle} vs blueprint ${founderHandle}`
    )
    status = 'unknown_error'
    statusDetail.error = 'founder_os_id / handle mismatch between identity and blueprint'
  } else {
    push(checks, 'handle_blueprint_sync', 'Identity ↔ blueprint handle', true, handle)
  }

  const founderOsId = spec.output?.founder_os_id ?? handleToFounderOsId(handle)
  const expectedOsId = handleToFounderOsId(founderHandle ?? handle)
  statusDetail.founderOsId = founderOsId

  push(
    checks,
    'founder_os_id',
    'founder_os_id',
    founderOsId === expectedOsId,
    `${founderOsId}${founderOsId !== expectedOsId ? ` (expected ${expectedOsId})` : ''}`
  )
  if (founderOsId !== expectedOsId) {
    status = 'unknown_error'
    statusDetail.error = 'founder_os_id does not match handle convention'
  }

  const packagePath = packagePathForHandle(founderHandle ?? handle)
  statusDetail.packagePath = packagePath

  const pkgRoot = process.env.FOUNDER_OS_OUTPUT_ROOT ?? join(process.cwd(), '..', 'founder-os')
  push(
    checks,
    'package_root',
    'Founder OS output root',
    await pathExists(pkgRoot),
    pkgRoot
  )

  const hasPackageDir = await pathExists(packagePath)
  push(
    checks,
    'package_dir',
    'Founder OS package folder',
    hasPackageDir,
    packagePath
  )

  if (!hasPackageDir) {
    status = 'missing_founder_os'
    return finalize(checks, status, statusDetail)
  }

  const hasManifest = await pathExists(join(packagePath, 'manifest.json'))
  push(
    checks,
    'manifest',
    'manifest.json',
    hasManifest,
    hasManifest ? 'Present' : 'Missing'
  )
  if (!hasManifest) {
    status = 'missing_manifest'
    return finalize(checks, status, statusDetail)
  }

  const hasRegistry = await pathExists(join(packagePath, 'registry.yaml'))
  push(
    checks,
    'registry',
    'registry.yaml',
    hasRegistry,
    hasRegistry ? 'Present' : 'Missing'
  )
  if (!hasRegistry) {
    status = 'missing_registry'
    return finalize(checks, status, statusDetail)
  }

  try {
    const { loadJysonRuntimeModules } = await import('@/lib/jyson-bridge/jyson-runtime-loader')
    const { buildAgentContext } = await loadJysonRuntimeModules()
    await buildAgentContext(packagePath)
    push(checks, 'agent_context', 'AgentContext (P6)', true, 'Loaded from package')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    push(checks, 'agent_context', 'AgentContext (P6)', false, msg)
    status = 'missing_agent_context'
    statusDetail.error = msg
  }

  return finalize(checks, status, statusDetail)
}

function finalize(
  checks: DiagnosticCheck[],
  status: CompanionDiagnosticStatus,
  detail: Parameters<typeof diagnosticForStatus>[1]
): CompanionWorldDiagnostics {
  const failed = checks.filter((c) => !c.ok)
  const missingStep = failed[0]?.label ?? 'All checks passed'
  const recommendedFix =
    status === 'missing_blueprint'
      ? 'Complete your Founder Blueprint in the wizard.'
      : status === 'missing_founder_os' ||
          status === 'missing_manifest' ||
          status === 'missing_registry'
        ? 'Generate your ACCESS world from the canonical blueprint.'
        : status === 'missing_identity'
          ? 'Create your ACCESS identity and blueprint.'
          : status === 'auth_missing'
            ? 'Sign in and restart the dev server if Clerk middleware was just added.'
            : status === 'missing_agent_context'
              ? 'Repair the Founder OS package and retry.'
              : failed[0]?.detail ?? 'Retry loading.'

  const diagnostic = diagnosticForStatus(status, detail)
  return { checks, missingStep, recommendedFix, diagnostic }
}
