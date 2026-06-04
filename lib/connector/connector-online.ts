import type { SupabaseClient } from '@supabase/supabase-js'

/** Grace window for manual Sync Now after `npm run connector:heartbeat`. */
export const CONNECTOR_ONLINE_TTL_MS = 5 * 60 * 1000

export type ConnectorOnlineState = {
  online: boolean
  lastSeenAt: string | null
  deviceId?: string
}

/** Parse Supabase timestamptz (variable fractional-second width). */
export function parseHeartbeatTimestamp(lastSeenAt: string): number {
  const direct = new Date(lastSeenAt).getTime()
  if (!Number.isNaN(direct)) return direct

  const normalized = lastSeenAt.replace(
    /(\d{2}:\d{2}:\d{2})\.(\d{1,6})/,
    (_, hms: string, frac: string) => `${hms}.${frac.padEnd(3, '0').slice(0, 3)}`
  )
  const ts = new Date(normalized).getTime()
  return Number.isNaN(ts) ? NaN : ts
}

export function isRecentHeartbeat(lastSeenAt: string | null | undefined, now = Date.now()): boolean {
  if (!lastSeenAt) return false
  const ts = parseHeartbeatTimestamp(lastSeenAt)
  if (Number.isNaN(ts)) return false
  return now - ts <= CONNECTOR_ONLINE_TTL_MS
}

type ActiveDeviceRow = {
  id: string
  last_seen_at: string | null
}

function stateFromDeviceRow(row: ActiveDeviceRow | null | undefined): ConnectorOnlineState {
  if (!row) {
    return { online: false, lastSeenAt: null }
  }
  const lastSeenAt = row.last_seen_at
  return {
    online: isRecentHeartbeat(lastSeenAt),
    lastSeenAt,
    deviceId: row.id,
  }
}

function preferMoreRecent(
  a: ConnectorOnlineState,
  b: ConnectorOnlineState
): ConnectorOnlineState {
  if (a.online && !b.online) return a
  if (b.online && !a.online) return b
  const aTs = a.lastSeenAt ? new Date(a.lastSeenAt).getTime() : 0
  const bTs = b.lastSeenAt ? new Date(b.lastSeenAt).getTime() : 0
  return bTs >= aTs ? b : a
}

async function fetchLatestActiveConnectorDevice(
  supabase: SupabaseClient,
  filter: { column: 'identity_id' | 'clerk_user_id'; value: string }
): Promise<ConnectorOnlineState> {
  const { data, error } = await supabase
    .from('connector_devices')
    .select('id, last_seen_at, status')
    .eq(filter.column, filter.value)
    .eq('status', 'active')
    .order('last_seen_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return { online: false, lastSeenAt: null }
  }

  return stateFromDeviceRow(data as ActiveDeviceRow)
}

export async function isConnectorOnlineForIdentity(
  supabase: SupabaseClient,
  identityId: string
): Promise<ConnectorOnlineState> {
  return fetchLatestActiveConnectorDevice(supabase, { column: 'identity_id', value: identityId })
}

/** Heartbeat updates the device row by id; match the same Clerk user on connector_devices. */
async function isConnectorOnlineForClerkUserOnDevices(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<ConnectorOnlineState> {
  return fetchLatestActiveConnectorDevice(supabase, { column: 'clerk_user_id', value: clerkUserId })
}

export async function isConnectorOnlineForClerkUser(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<ConnectorOnlineState> {
  const byClerkDevice = await isConnectorOnlineForClerkUserOnDevices(supabase, clerkUserId)
  if (byClerkDevice.online) {
    return byClerkDevice
  }

  const { data: identity, error } = await supabase
    .from('access_identities')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  if (error || !identity?.id) {
    return byClerkDevice
  }

  const byIdentity = await isConnectorOnlineForIdentity(supabase, identity.id as string)
  return preferMoreRecent(byClerkDevice, byIdentity)
}

export async function isConnectorOnlineForHandle(
  supabase: SupabaseClient,
  handle: string
): Promise<ConnectorOnlineState> {
  const { data: identity, error } = await supabase
    .from('access_identities')
    .select('id, clerk_user_id')
    .eq('handle', handle)
    .maybeSingle()

  if (error || !identity?.id) {
    return { online: false, lastSeenAt: null }
  }

  const clerkUserId = identity.clerk_user_id as string | null
  if (clerkUserId) {
    const byClerk = await isConnectorOnlineForClerkUserOnDevices(supabase, clerkUserId)
    if (byClerk.online) return byClerk
  }

  return isConnectorOnlineForIdentity(supabase, identity.id as string)
}
