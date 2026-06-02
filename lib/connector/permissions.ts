import type { ConnectorPermission } from '@/lib/connector-auth/types'

export const DEFAULT_CONNECTOR_PERMISSIONS: ConnectorPermission[] = [
  'heartbeat',
  'sync:apply',
  'sync:enqueue',
]

export function parsePermissions(raw: unknown): ConnectorPermission[] {
  if (!Array.isArray(raw)) return DEFAULT_CONNECTOR_PERMISSIONS
  const allowed = new Set(DEFAULT_CONNECTOR_PERMISSIONS)
  return raw.filter((p): p is ConnectorPermission => allowed.has(p as ConnectorPermission))
}
