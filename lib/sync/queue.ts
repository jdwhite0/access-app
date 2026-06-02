import type { SupabaseClient } from '@supabase/supabase-js'
import type { VerifiedConnectorDevice } from '@/lib/connector-auth/types'
import { parsePermissions } from '@/lib/connector/permissions'
import { resolveOwnershipContext } from '@/lib/connector/ownership-guards'
import { executeSyncApply } from './apply-engine'

export async function enqueueSyncJob(input: {
  supabase: SupabaseClient
  device: VerifiedConnectorDevice
  planPayload: unknown
}): Promise<
  | { ok: true; jobId: string; syncRunId: string | null }
  | { ok: false; error: string }
> {
  const ownership = await resolveOwnershipContext(input.supabase, input.device)
  if (!ownership.ok) return { ok: false, error: ownership.error }

  const ctx = ownership.ctx

  const { data: job, error } = await input.supabase
    .from('sync_jobs')
    .insert({
      identity_id: ctx.identityId,
      clerk_user_id: ctx.clerkUserId,
      vault_connection_id: ctx.vaultConnectionId,
      connector_device_id: ctx.deviceId,
      status: 'pending',
      payload: input.planPayload,
      scheduled_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !job) return { ok: false, error: error?.message ?? 'Enqueue failed.' }

  return { ok: true, jobId: job.id as string, syncRunId: null }
}

export async function processNextSyncJob(
  supabase: SupabaseClient
): Promise<{ processed: boolean; jobId?: string; report?: unknown }> {
  const { data: job } = await supabase
    .from('sync_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!job) return { processed: false }

  const { data: device } = await supabase
    .from('connector_devices')
    .select('id, identity_id, clerk_user_id, vault_connection_id, permissions, token_jti')
    .eq('id', job.connector_device_id)
    .maybeSingle()

  if (!device) {
    await supabase
      .from('sync_jobs')
      .update({
        status: 'failed',
        last_error: 'Device not found',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)
    return { processed: true, jobId: job.id }
  }

  const { data: vault } = await supabase
    .from('vault_connections')
    .select('vault_key')
    .eq('id', job.vault_connection_id)
    .maybeSingle()

  await supabase
    .from('sync_jobs')
    .update({
      status: 'processing',
      started_at: new Date().toISOString(),
      attempts: (job.attempts ?? 0) + 1,
    })
    .eq('id', job.id)

  const syntheticDevice: VerifiedConnectorDevice = {
    sub: device.id as string,
    identity_id: device.identity_id as string,
    clerk_user_id: device.clerk_user_id as string,
    vault_connection_id: job.vault_connection_id as string,
    vault_key: (vault?.vault_key as string) ?? 'primary_vault',
    permissions: parsePermissions(device.permissions),
    jti: (device.token_jti as string) ?? 'worker',
    iat: 0,
    exp: 0,
  }

  const report = await executeSyncApply({
    supabase,
    device: syntheticDevice,
    planPayload: job.payload,
    runType: 'async_worker',
  })

  const attempts = (job.attempts ?? 0) + 1
  const maxAttempts = job.max_attempts ?? 5

  if (report.ok) {
    await supabase
      .from('sync_jobs')
      .update({
        status: 'completed',
        sync_run_id: report.syncRunId,
        completed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', job.id)
  } else if (attempts >= maxAttempts) {
    await supabase
      .from('sync_jobs')
      .update({
        status: 'dead_letter',
        completed_at: new Date().toISOString(),
        last_error: report.error ?? 'Max attempts exceeded',
      })
      .eq('id', job.id)
  } else {
    await supabase
      .from('sync_jobs')
      .update({
        status: 'pending',
        scheduled_at: new Date(Date.now() + attempts * 60_000).toISOString(),
        last_error: report.error ?? 'Apply failed',
      })
      .eq('id', job.id)
  }

  return { processed: true, jobId: job.id, report }
}
