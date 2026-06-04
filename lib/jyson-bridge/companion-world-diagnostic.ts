/**
 * ACCESS OS companion world diagnostic — hybrid cloud+local model.
 *
 * Check order:
 *   1. Auth / environment gates
 *   2. Identity gate
 *   3. Blueprint row + validation
 *   4. CLOUD GATE — blueprint export status (draft → block; exported → cloud_package_ready)
 *   5. LOCAL UPGRADE — filesystem checks (upgrade to local_founder_os_ready / companion_ready)
 *
 * The local filesystem is an upgrade path, not a requirement gate.
 * Production (Vercel) runs in cloud mode and relies on Supabase blueprint state.
 */
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { auth } from '@clerk/nextjs/server'
import { handleToFounderOsId } from '@/lib/blueprint/defaults'
import { validateFounderBlueprint } from '@/lib/blueprint/validate-mvp'
import { packagePathForHandle } from '@/lib/access-handle/package-loader'
import { getIdentity, getOrCreateIdentity } from '@/lib/actions/identity'
import { getFounderBlueprint, getOrCreateFounderBlueprint } from '@/lib/actions/founder-blueprint'
import { isSupabaseConfigured } from '@/lib/supabase'
import { isConnectorOnlineForClerkUser } from '@/lib/connector/connector-online'
import { createSupabaseAdmin } from '@/lib/supabase'
import { deriveAccessHandleForSession } from '@/lib/jyson-bridge/companion-handle'
import {
  diagnosticForStatus,
  type CompanionDiagnostic,
  type CompanionDiagnosticStatus,
} from '@/lib/jyson-bridge/companion-diagnostic'
import { getCloudVaultReadySnapshot } from '@/lib/vault/cloud-vault-ready'

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

const STATUS_FIX: Partial<Record<CompanionDiagnosticStatus, string>> = {
  companion_ready: 'JYSON Companion is fully connected.',
  local_founder_os_ready: 'Local Founder OS connected.',
  local_sync_pending: 'Cloud package ready. Connect your local machine to sync.',
  cloud_package_ready: 'Companion loading from cloud.',
  blueprint_draft: 'Export your Founder Blueprint to activate the companion.',
  blueprint_missing: 'Complete your Founder Blueprint in the wizard.',
  identity_missing: 'Create your ACCESS identity and blueprint.',
  connector_offline: 'Start your local ACCESS connector to sync.',
  sync_error: 'Regenerate your Founder OS package.',
  auth_missing: 'Sign in and restart the dev server if Clerk middleware was just added.',
  unknown_error: 'Retry loading.',
}

export async function diagnoseCompanionWorld(options?: {
  ensureIdentity?: boolean
}): Promise<CompanionWorldDiagnostics> {
  const checks: DiagnosticCheck[] = []
  let status: CompanionDiagnosticStatus = 'companion_ready'
  let statusDetail: Parameters<typeof diagnosticForStatus>[1] = {}

  // ── 1. Environment ────────────────────────────────────────────────────────
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

  // ── 2. Auth ───────────────────────────────────────────────────────────────
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

  if (!userId) return await finalize(checks, status, statusDetail, userId)

  // ── 3. Identity ───────────────────────────────────────────────────────────
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
      status = 'identity_missing'
      statusDetail = { handle: derivedHandle, error: created.error }
      return await finalize(checks, status, statusDetail, userId)
    }
  }

  push(
    checks,
    'identity',
    'ACCESS identity',
    !!identity?.handle,
    identity?.handle
      ? `Handle: ${identity.handle}`
      : 'No access_identities row for this Clerk user'
  )
  if (!identity?.handle) {
    status = 'identity_missing'
    statusDetail = { handle: derivedHandle }
    return await finalize(checks, status, statusDetail, userId)
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
    if (status === 'companion_ready') status = 'unknown_error'
    statusDetail.error = 'ACCESS handle mismatch with current Clerk profile'
  } else {
    push(checks, 'handle_match', 'Clerk profile vs saved handle', true, handle)
  }

  // ── 4. Blueprint row + validation ─────────────────────────────────────────
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
    status = 'blueprint_missing'
    return await finalize(checks, status, statusDetail, userId)
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
    return await finalize(checks, status, statusDetail, userId)
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
    if (status === 'companion_ready') status = 'unknown_error'
    statusDetail.error = 'Handle mismatch between identity and blueprint'
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
  if (founderOsId !== expectedOsId && status === 'companion_ready') {
    status = 'unknown_error'
    statusDetail.error = 'founder_os_id does not match handle convention'
  }

  // ── 5. CLOUD GATE: blueprint export status ────────────────────────────────
  // Vault cloud context can unlock companion even when blueprint is still draft.
  const blueprintExported = spec.status === 'exported' || spec.status === 'materialized'
  const vaultCloud =
    userId != null ? await getCloudVaultReadySnapshot(userId) : { ready: false, vaultCount: 0, chunkCount: 0, hasSyncedVault: false }

  push(
    checks,
    'vault_cloud',
    'Vault cloud context',
    vaultCloud.ready,
    vaultCloud.ready
      ? `${vaultCloud.vaultCount} vault(s) · ${vaultCloud.chunkCount} indexed chunk(s)`
      : 'No synced vault context in cloud yet'
  )

  const cloudUnlocked = blueprintExported || vaultCloud.ready

  push(
    checks,
    'blueprint_status',
    'Blueprint cloud status',
    cloudUnlocked,
    blueprintExported
      ? `${spec.status} — companion can load from cloud`
      : vaultCloud.ready
        ? 'Draft blueprint — companion unlocked via synced vault'
        : 'Draft — export blueprint or sync a vault to activate the companion'
  )

  if (!cloudUnlocked) {
    status = 'blueprint_draft'
    return await finalize(checks, status, statusDetail, userId)
  }

  // Blueprint is exported — companion CAN load from cloud.
  // Mark cloud as ready; we will try local as an upgrade below.
  if (status === 'companion_ready') status = 'cloud_package_ready'
  statusDetail.cloudReady = true

  // ── 6. LOCAL UPGRADE: filesystem checks ───────────────────────────────────
  // These are not gates — they upgrade the companion state to use local data.
  const packagePath = packagePathForHandle(founderHandle ?? handle)
  statusDetail.packagePath = packagePath

  const hasOutputRoot = !!process.env.FOUNDER_OS_OUTPUT_ROOT
  const isServerless =
    !hasOutputRoot && (!!process.env.VERCEL || process.env.NODE_ENV === 'production')

  if (isServerless) {
    push(
      checks,
      'local_runtime',
      'Local Founder OS (cloud mode)',
      false,
      'Cloud deployment — local filesystem not available'
    )
    push(
      checks,
      'agent_context',
      'Agent context (local)',
      false,
      'Not available in cloud deployment — companion loads from blueprint'
    )
    if (status === 'cloud_package_ready') status = 'local_sync_pending'
    statusDetail.error =
      'Cloud deployment — local Founder OS not available. Companion loads from cloud.'
    return await finalize(checks, status, statusDetail, userId)
  }

  // Local mode: check if the output root exists
  const pkgRoot =
    process.env.FOUNDER_OS_OUTPUT_ROOT ?? join(process.cwd(), '..', 'founder-os')
  push(
    checks,
    'package_root',
    'Founder OS output root',
    await pathExists(pkgRoot),
    pkgRoot
  )

  // Check if the specific package folder exists
  const hasPackageDir = await pathExists(packagePath)
  push(
    checks,
    'package_dir',
    'Local Founder OS folder',
    hasPackageDir,
    packagePath
  )

  if (!hasPackageDir) {
    // Cloud package ready but local folder not materialized yet
    if (status === 'cloud_package_ready') status = 'local_sync_pending'
    return await finalize(checks, status, statusDetail, userId)
  }

  // Local package exists — check its completeness
  const hasManifest = await pathExists(join(packagePath, 'manifest.json'))
  push(checks, 'manifest', 'manifest.json', hasManifest, hasManifest ? 'Present' : 'Missing')
  if (!hasManifest) {
    status = 'sync_error'
    statusDetail.error = 'manifest.json missing from local Founder OS package'
    return await finalize(checks, status, statusDetail, userId)
  }

  const hasRegistry = await pathExists(join(packagePath, 'registry.yaml'))
  push(checks, 'registry', 'registry.yaml', hasRegistry, hasRegistry ? 'Present' : 'Missing')
  if (!hasRegistry) {
    status = 'sync_error'
    statusDetail.error = 'registry.yaml missing from local Founder OS package'
    return await finalize(checks, status, statusDetail, userId)
  }

  // Local package is complete — upgrade from cloud_package_ready
  status = 'local_founder_os_ready'
  statusDetail.localReady = true

  // ── 7. AGENT CONTEXT: optional upgrade to companion_ready ─────────────────
  try {
    const { loadJysonRuntimeModules } = await import('@/lib/jyson-bridge/jyson-runtime-loader')
    const { buildAgentContext } = await loadJysonRuntimeModules()
    await buildAgentContext(packagePath)
    push(checks, 'agent_context', 'Agent context (local)', true, 'Loaded from local package')
    status = 'companion_ready'
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    push(checks, 'agent_context', 'Agent context (local)', false, msg)
    // Stays at local_founder_os_ready — companion still loads from local filesystem
    statusDetail.error = msg
  }

  return await finalize(checks, status, statusDetail, userId)
}

async function finalize(
  checks: DiagnosticCheck[],
  status: CompanionDiagnosticStatus,
  detail: Parameters<typeof diagnosticForStatus>[1],
  clerkUserId?: string | null
): Promise<CompanionWorldDiagnostics> {
  const failed = checks.filter((c) => !c.ok)
  const missingStep = failed[0]?.label ?? 'All checks passed'
  const recommendedFix = STATUS_FIX[status] ?? failed[0]?.detail ?? 'Retry loading.'

  const cloudReady = (
    status === 'cloud_package_ready' ||
    status === 'local_sync_pending' ||
    status === 'local_founder_os_ready' ||
    status === 'companion_ready'
  )
  const localReady = status === 'local_founder_os_ready' || status === 'companion_ready'

  let connectorOnline = false
  const supabase = createSupabaseAdmin()
  if (supabase && clerkUserId) {
    const connector = await isConnectorOnlineForClerkUser(supabase, clerkUserId)
    connectorOnline = connector.online
    push(
      checks,
      'connector_heartbeat',
      'ACCESS connector heartbeat',
      connectorOnline,
      connectorOnline
        ? `Last seen ${connector.lastSeenAt ?? 'recently'}`
        : 'No active device heartbeat in the last 90s'
    )
  } else {
    push(
      checks,
      'connector_heartbeat',
      'ACCESS connector heartbeat',
      false,
      clerkUserId ? 'Supabase not configured' : 'Sign in to check connector'
    )
  }

  const diagnostic = diagnosticForStatus(status, {
    ...detail,
    cloudReady,
    localReady,
    connectorOnline,
  })
  return { checks, missingStep, recommendedFix, diagnostic }
}
