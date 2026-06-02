import type { SupabaseClient } from '@supabase/supabase-js'
import type { VerifiedConnectorDevice } from '@/lib/connector-auth/types'
import { resolveOwnershipContext } from '@/lib/connector/ownership-guards'
import { createSupabaseAdmin } from '@/lib/supabase'
import { createTenantSupabase, isTenantSupabaseConfigured } from '@/lib/supabase/tenant-client'
import { setSupabaseRequestContext } from '@/lib/supabase/request-context'
import { validateApprovedSyncPlan } from './validate-plan'
import { upsertRegistryRow } from './metadata-upsert'
import { writeSyncAuditEvent } from './audit'
import { applyRollback, type RollbackSnapshot } from './rollback'

export type SyncApplyReport = {
  ok: boolean
  syncRunId: string | null
  stats: {
    upserted: number
    skipped: number
    conflicts: number
    errors: number
  }
  error?: string
  rollbackApplied?: boolean
}

export async function executeSyncApply(input: {
  supabase?: SupabaseClient
  device: VerifiedConnectorDevice
  planPayload: unknown
  runType?: string
}): Promise<SyncApplyReport> {
  const admin = input.supabase ?? createSupabaseAdmin()
  if (!admin) {
    return {
      ok: false,
      syncRunId: null,
      stats: { upserted: 0, skipped: 0, conflicts: 0, errors: 0 },
      error: 'Database not configured.',
    }
  }

  const ownership = await resolveOwnershipContext(admin, input.device)
  if (!ownership.ok) {
    return {
      ok: false,
      syncRunId: null,
      stats: { upserted: 0, skipped: 0, conflicts: 0, errors: 0 },
      error: ownership.error,
    }
  }

  const ctx = ownership.ctx

  const validated = validateApprovedSyncPlan(input.planPayload, ctx.vaultKey)
  if (!validated.ok) {
    return {
      ok: false,
      syncRunId: null,
      stats: { upserted: 0, skipped: 0, conflicts: 0, errors: 0 },
      error: validated.error,
    }
  }

  if (validated.plan.identityHandle !== ctx.ownerHandle) {
    return {
      ok: false,
      syncRunId: null,
      stats: { upserted: 0, skipped: 0, conflicts: 0, errors: 0 },
      error: 'Plan identityHandle does not match device identity.',
    }
  }

  let supabase: SupabaseClient = admin
  if (isTenantSupabaseConfigured()) {
    const tenant = await createTenantSupabase({
      identityId: ctx.identityId,
      clerkUserId: ctx.clerkUserId,
    })
    if (tenant) supabase = tenant
  } else {
    await setSupabaseRequestContext(admin, ctx.identityId, ctx.clerkUserId)
  }

  const { data: syncRun, error: runError } = await supabase
    .from('sync_runs')
    .insert({
      identity_id: ctx.identityId,
      clerk_user_id: ctx.clerkUserId,
      vault_connection_id: ctx.vaultConnectionId,
      run_type: input.runType ?? 'connector_apply',
      status: 'started',
      stats: { planned: validated.plan.planned.length },
    })
    .select('id')
    .single()

  if (runError || !syncRun) {
    return {
      ok: false,
      syncRunId: null,
      stats: { upserted: 0, skipped: 0, conflicts: 0, errors: 0 },
      error: runError?.message ?? 'Failed to create sync run.',
    }
  }

  const syncRunId = syncRun.id as string
  const snapshots: RollbackSnapshot[] = []
  const stats = { upserted: 0, skipped: 0, conflicts: 0, errors: 0 }

  await writeSyncAuditEvent(supabase, {
    syncRunId,
    identityId: ctx.identityId,
    clerkUserId: ctx.clerkUserId,
    vaultConnectionId: ctx.vaultConnectionId,
    connectorDeviceId: ctx.deviceId,
    eventType: 'run_started',
    payload: { rowCount: validated.plan.planned.length },
  })

  await admin
    .from('vault_connections')
    .update({ status: 'syncing', last_sync_status: 'in_progress' })
    .eq('id', ctx.vaultConnectionId)
    .eq('identity_id', ctx.identityId)

  let fatalError: string | null = null

  for (const row of validated.plan.planned) {
    try {
      const result = await upsertRegistryRow(supabase, ctx, row)

      if (result.status === 'upserted') {
        stats.upserted += 1
        if (result.snapshot) snapshots.push(result.snapshot)
        await writeSyncAuditEvent(supabase, {
          syncRunId,
          identityId: ctx.identityId,
          clerkUserId: ctx.clerkUserId,
          vaultConnectionId: ctx.vaultConnectionId,
          connectorDeviceId: ctx.deviceId,
          eventType: 'row_upserted',
          objectType: row.objectType,
          sourceRef: row.sourceRef,
          payload: { id: result.id, table: result.table },
        })
      } else if (result.status === 'skipped') {
        stats.skipped += 1
        await writeSyncAuditEvent(supabase, {
          syncRunId,
          identityId: ctx.identityId,
          clerkUserId: ctx.clerkUserId,
          vaultConnectionId: ctx.vaultConnectionId,
          connectorDeviceId: ctx.deviceId,
          eventType: 'row_skipped',
          objectType: row.objectType,
          sourceRef: row.sourceRef,
          payload: { reason: result.reason },
        })
      } else {
        stats.conflicts += 1
        await writeSyncAuditEvent(supabase, {
          syncRunId,
          identityId: ctx.identityId,
          clerkUserId: ctx.clerkUserId,
          vaultConnectionId: ctx.vaultConnectionId,
          connectorDeviceId: ctx.deviceId,
          eventType: 'row_conflict',
          objectType: row.objectType,
          sourceRef: row.sourceRef,
          payload: { reason: result.reason },
        })
      }
    } catch (e) {
      stats.errors += 1
      fatalError = e instanceof Error ? e.message : 'Row apply failed.'
      break
    }
  }

  if (fatalError && snapshots.length > 0) {
    const rollback = await applyRollback(supabase, snapshots)
    await writeSyncAuditEvent(supabase, {
      syncRunId,
      identityId: ctx.identityId,
      clerkUserId: ctx.clerkUserId,
      vaultConnectionId: ctx.vaultConnectionId,
      connectorDeviceId: ctx.deviceId,
      eventType: 'rollback_applied',
      payload: { errors: rollback.errors },
    })
  }

  const completed = !fatalError
  const finalStatus = completed ? 'completed' : 'failed'

  await supabase
    .from('sync_runs')
    .update({
      status: finalStatus,
      completed_at: new Date().toISOString(),
      stats: { ...stats, rollbackSnapshots: snapshots.length },
      error_message: fatalError,
    })
    .eq('id', syncRunId)

  await admin
    .from('vault_connections')
    .update({
      status: completed ? 'connected' : 'error',
      last_sync_at: new Date().toISOString(),
      last_sync_status: finalStatus,
    })
    .eq('id', ctx.vaultConnectionId)
    .eq('identity_id', ctx.identityId)

  await writeSyncAuditEvent(supabase, {
    syncRunId,
    identityId: ctx.identityId,
    clerkUserId: ctx.clerkUserId,
    vaultConnectionId: ctx.vaultConnectionId,
    connectorDeviceId: ctx.deviceId,
    eventType: completed ? 'run_completed' : 'run_failed',
    payload: stats,
  })

  return {
    ok: completed,
    syncRunId,
    stats,
    error: fatalError ?? undefined,
    rollbackApplied: fatalError ? snapshots.length > 0 : undefined,
  }
}
