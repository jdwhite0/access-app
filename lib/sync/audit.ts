import type { SupabaseClient } from '@supabase/supabase-js'

export async function writeSyncAuditEvent(
  supabase: SupabaseClient,
  event: {
    syncRunId: string | null
    identityId: string
    clerkUserId: string
    vaultConnectionId: string | null
    connectorDeviceId: string | null
    eventType: string
    objectType?: string
    sourceRef?: string
    payload?: Record<string, unknown>
  }
): Promise<void> {
  await supabase.from('sync_audit_events').insert({
    sync_run_id: event.syncRunId,
    identity_id: event.identityId,
    clerk_user_id: event.clerkUserId,
    vault_connection_id: event.vaultConnectionId,
    connector_device_id: event.connectorDeviceId,
    event_type: event.eventType,
    object_type: event.objectType ?? null,
    source_ref: event.sourceRef ?? null,
    payload: event.payload ?? {},
  })
}
