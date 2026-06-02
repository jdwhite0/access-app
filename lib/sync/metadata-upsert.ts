import type { SupabaseClient } from '@supabase/supabase-js'
import type { OwnershipContext } from '@/lib/connector/ownership-guards'
import type { SyncPlanRow } from './validate-plan'
import type { RollbackSnapshot } from './rollback'

const MAX_NAME_LEN = 500

export type UpsertResult =
  | { status: 'upserted'; table: string; id: string; snapshot?: RollbackSnapshot }
  | { status: 'skipped'; reason: string }
  | { status: 'conflict'; reason: string; existingId?: string }

function slugHandle(name: string, sourceRef: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const suffix = sourceRef.slice(0, 6)
  return `${base || 'vault'}-${suffix}.access`
}

const provenance = (ctx: OwnershipContext, row: SyncPlanRow) => ({
  identity_id: ctx.identityId,
  clerk_user_id: ctx.clerkUserId,
  vault_connection_id: ctx.vaultConnectionId,
  source_kind: row.sourceKind,
  source_vault_key: ctx.vaultKey,
  source_path: row.sourcePath,
  source_ref: row.sourceRef,
  content_hash: row.contentHash ?? null,
  last_synced_at: new Date().toISOString(),
  visibility: 'private',
})

async function findBySourceRef(
  supabase: SupabaseClient,
  table: string,
  identityId: string,
  sourceRef: string
) {
  const { data } = await supabase
    .from(table)
    .select('*')
    .eq('identity_id', identityId)
    .eq('source_ref', sourceRef)
    .maybeSingle()
  return data as Record<string, unknown> | null
}

export async function upsertRegistryRow(
  supabase: SupabaseClient,
  ctx: OwnershipContext,
  row: SyncPlanRow
): Promise<UpsertResult> {
  const existing = await findBySourceRef(
    supabase,
    tableForType(row.objectType),
    ctx.identityId,
    row.sourceRef
  )

  if (existing) {
    const prevHash = existing.content_hash as string | null
    if (prevHash && row.contentHash && prevHash === row.contentHash) {
      return { status: 'skipped', reason: 'unchanged' }
    }
  }

  switch (row.objectType) {
    case 'system':
      return upsertSystem(supabase, ctx, row, existing)
    case 'project':
      return upsertProject(supabase, ctx, row, existing)
    case 'agent':
      return upsertAgent(supabase, ctx, row, existing)
    case 'asset':
      return upsertAsset(supabase, ctx, row, existing)
    case 'workflow':
      return upsertWorkflow(supabase, ctx, row, existing)
    case 'offer':
      return upsertOffer(supabase, ctx, row, existing)
    case 'blueprint':
      return upsertBlueprint(supabase, ctx, row, existing)
    default:
      return { status: 'skipped', reason: `unsupported type: ${row.objectType}` }
  }
}

function tableForType(objectType: string): string {
  switch (objectType) {
    case 'system':
      return 'systems'
    case 'project':
      return 'builder_projects'
    case 'agent':
      return 'agents'
    case 'asset':
      return 'assets'
    case 'workflow':
      return 'workflows'
    case 'offer':
      return 'offers'
    case 'blueprint':
      return 'blueprints'
    default:
      return 'systems'
  }
}

async function upsertSystem(
  supabase: SupabaseClient,
  ctx: OwnershipContext,
  row: SyncPlanRow,
  existing: Record<string, unknown> | null
): Promise<UpsertResult> {
  const system_handle = existing
    ? String(existing.system_handle)
    : slugHandle(row.name, row.sourceRef)

  const payload = {
    ...provenance(ctx, row),
    owner_handle: ctx.ownerHandle,
    system_handle,
    name: row.name.slice(0, MAX_NAME_LEN),
    type: 'knowledge' as const,
    description: `Vault import: ${row.sourcePath}`.slice(0, 500),
    status: 'active',
    sync_version: existing ? Number(existing.sync_version ?? 1) + 1 : 1,
  }

  if (existing?.id) {
    const snapshot: RollbackSnapshot = {
      table: 'systems',
      id: String(existing.id),
      previous: existing,
    }
    const { error } = await supabase.from('systems').update(payload).eq('id', existing.id)
    if (error) return { status: 'conflict', reason: error.message }
    return { status: 'upserted', table: 'systems', id: String(existing.id), snapshot }
  }

  const { data, error } = await supabase
    .from('systems')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { status: 'conflict', reason: error.message }
  return { status: 'upserted', table: 'systems', id: String(data.id) }
}

async function upsertProject(
  supabase: SupabaseClient,
  ctx: OwnershipContext,
  row: SyncPlanRow,
  existing: Record<string, unknown> | null
): Promise<UpsertResult> {
  const payload = {
    ...provenance(ctx, row),
    owner_handle: ctx.ownerHandle,
    name: row.name.slice(0, MAX_NAME_LEN),
    objective: row.reason?.slice(0, 500) ?? null,
    status: 'active',
    sync_version: existing ? Number(existing.sync_version ?? 1) + 1 : 1,
  }

  if (existing?.id) {
    const snapshot: RollbackSnapshot = {
      table: 'builder_projects',
      id: String(existing.id),
      previous: existing,
    }
    const { error } = await supabase
      .from('builder_projects')
      .update(payload)
      .eq('id', existing.id)
    if (error) return { status: 'conflict', reason: error.message }
    return { status: 'upserted', table: 'builder_projects', id: String(existing.id), snapshot }
  }

  const { data, error } = await supabase
    .from('builder_projects')
    .insert(payload)
    .select('id')
    .single()

  if (error) return { status: 'conflict', reason: error.message }
  return { status: 'upserted', table: 'builder_projects', id: String(data.id) }
}

async function upsertAgent(
  supabase: SupabaseClient,
  ctx: OwnershipContext,
  row: SyncPlanRow,
  existing: Record<string, unknown> | null
): Promise<UpsertResult> {
  const payload = {
    ...provenance(ctx, row),
    owner_handle: ctx.ownerHandle,
    name: row.name.slice(0, MAX_NAME_LEN),
    description: row.reason?.slice(0, 500) ?? null,
    status: 'active',
    sync_version: existing ? Number(existing.sync_version ?? 1) + 1 : 1,
  }

  if (existing?.id) {
    const snapshot: RollbackSnapshot = {
      table: 'agents',
      id: String(existing.id),
      previous: existing,
    }
    const { error } = await supabase.from('agents').update(payload).eq('id', existing.id)
    if (error) return { status: 'conflict', reason: error.message }
    return { status: 'upserted', table: 'agents', id: String(existing.id), snapshot }
  }

  const { data, error } = await supabase.from('agents').insert(payload).select('id').single()
  if (error) return { status: 'conflict', reason: error.message }
  return { status: 'upserted', table: 'agents', id: String(data.id) }
}

async function upsertAsset(
  supabase: SupabaseClient,
  ctx: OwnershipContext,
  row: SyncPlanRow,
  existing: Record<string, unknown> | null
): Promise<UpsertResult> {
  const payload = {
    ...provenance(ctx, row),
    owner_handle: ctx.ownerHandle,
    name: row.name.slice(0, MAX_NAME_LEN),
    description: row.reason?.slice(0, 500) ?? null,
    asset_type: 'document' as const,
    url: null,
    status: 'active',
    sync_version: existing ? Number(existing.sync_version ?? 1) + 1 : 1,
  }

  if (existing?.id) {
    const snapshot: RollbackSnapshot = {
      table: 'assets',
      id: String(existing.id),
      previous: existing,
    }
    const { error } = await supabase.from('assets').update(payload).eq('id', existing.id)
    if (error) return { status: 'conflict', reason: error.message }
    return { status: 'upserted', table: 'assets', id: String(existing.id), snapshot }
  }

  const { data, error } = await supabase.from('assets').insert(payload).select('id').single()
  if (error) return { status: 'conflict', reason: error.message }
  return { status: 'upserted', table: 'assets', id: String(data.id) }
}

async function upsertWorkflow(
  supabase: SupabaseClient,
  ctx: OwnershipContext,
  row: SyncPlanRow,
  existing: Record<string, unknown> | null
): Promise<UpsertResult> {
  const payload = {
    ...provenance(ctx, row),
    owner_handle: ctx.ownerHandle,
    name: row.name.slice(0, MAX_NAME_LEN),
    description: row.reason?.slice(0, 500) ?? null,
    status: 'active',
    sync_version: existing ? Number(existing.sync_version ?? 1) + 1 : 1,
  }

  if (existing?.id) {
    const snapshot: RollbackSnapshot = {
      table: 'workflows',
      id: String(existing.id),
      previous: existing,
    }
    const { error } = await supabase.from('workflows').update(payload).eq('id', existing.id)
    if (error) return { status: 'conflict', reason: error.message }
    return { status: 'upserted', table: 'workflows', id: String(existing.id), snapshot }
  }

  const { data, error } = await supabase.from('workflows').insert(payload).select('id').single()
  if (error) return { status: 'conflict', reason: error.message }
  return { status: 'upserted', table: 'workflows', id: String(data.id) }
}

async function upsertOffer(
  supabase: SupabaseClient,
  ctx: OwnershipContext,
  row: SyncPlanRow,
  existing: Record<string, unknown> | null
): Promise<UpsertResult> {
  const payload = {
    ...provenance(ctx, row),
    owner_handle: ctx.ownerHandle,
    name: row.name.slice(0, MAX_NAME_LEN),
    description: row.reason?.slice(0, 500) ?? null,
    status: 'draft' as const,
    sync_version: existing ? Number(existing.sync_version ?? 1) + 1 : 1,
  }

  if (existing?.id) {
    const snapshot: RollbackSnapshot = {
      table: 'offers',
      id: String(existing.id),
      previous: existing,
    }
    const { error } = await supabase.from('offers').update(payload).eq('id', existing.id)
    if (error) return { status: 'conflict', reason: error.message }
    return { status: 'upserted', table: 'offers', id: String(existing.id), snapshot }
  }

  const { data, error } = await supabase.from('offers').insert(payload).select('id').single()
  if (error) return { status: 'conflict', reason: error.message }
  return { status: 'upserted', table: 'offers', id: String(data.id) }
}

async function upsertBlueprint(
  supabase: SupabaseClient,
  ctx: OwnershipContext,
  row: SyncPlanRow,
  existing: Record<string, unknown> | null
): Promise<UpsertResult> {
  const answers = [{ sourcePath: row.sourcePath, note: row.reason ?? 'vault metadata' }]

  const payload = {
    ...provenance(ctx, row),
    owner_handle: ctx.ownerHandle,
    type: 'knowledge' as const,
    answers,
    sync_version: existing ? Number(existing.sync_version ?? 1) + 1 : 1,
  }

  if (existing?.id) {
    const snapshot: RollbackSnapshot = {
      table: 'blueprints',
      id: String(existing.id),
      previous: existing,
    }
    const { error } = await supabase.from('blueprints').update(payload).eq('id', existing.id)
    if (error) return { status: 'conflict', reason: error.message }
    return { status: 'upserted', table: 'blueprints', id: String(existing.id), snapshot }
  }

  const { data, error } = await supabase.from('blueprints').insert(payload).select('id').single()
  if (error) return { status: 'conflict', reason: error.message }
  return { status: 'upserted', table: 'blueprints', id: String(data.id) }
}
