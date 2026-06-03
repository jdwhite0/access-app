import type { SupabaseClient } from '@supabase/supabase-js'

/** Device is online if heartbeat within this window (matches connector heartbeat interval). */
export const CONNECTOR_ONLINE_TTL_MS = 90_000

export type ConnectorOnlineState = {
  online: boolean
  lastSeenAt: string | null
  deviceId?: string
}

export function isRecentHeartbeat(lastSeenAt: string | null | undefined, now = Date.now()): boolean {
  if (!lastSeenAt) return false
  const ts = new Date(lastSeenAt).getTime()
  if (Number.isNaN(ts)) return false
  return now - ts <= CONNECTOR_ONLINE_TTL_MS
}

export async function isConnectorOnlineForIdentity(
  supabase: SupabaseClient,
  identityId: string
): Promise<ConnectorOnlineState> {
  const { data, error } = await supabase
    .from('connector_devices')
    .select('id, last_seen_at, status')
    .eq('identity_id', identityId)
    .eq('status', 'active')
    .order('last_seen_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return { online: false, lastSeenAt: null }
  }

  const lastSeenAt = data.last_seen_at as string | null
  return {
    online: isRecentHeartbeat(lastSeenAt),
    lastSeenAt,
    deviceId: data.id as string,
  }
}

export async function isConnectorOnlineForClerkUser(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<ConnectorOnlineState> {
  const { data: identity, error } = await supabase
    .from('access_identities')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  if (error || !identity?.id) {
    return { online: false, lastSeenAt: null }
  }

  return isConnectorOnlineForIdentity(supabase, identity.id as string)
}

export async function isConnectorOnlineForHandle(
  supabase: SupabaseClient,
  handle: string
): Promise<ConnectorOnlineState> {
  const { data: identity, error } = await supabase
    .from('access_identities')
    .select('id')
    .eq('handle', handle)
    .maybeSingle()

  if (error || !identity?.id) {
    return { online: false, lastSeenAt: null }
  }

  return isConnectorOnlineForIdentity(supabase, identity.id as string)
}
