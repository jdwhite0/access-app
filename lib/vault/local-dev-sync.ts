import { existsSync } from 'fs'

/**
 * Local-only vault sync: when ACCESS runs as `next dev` on the Mac that holds
 * the vault folder, Sync Now can scan disk without a live connector heartbeat.
 * Never enabled on Vercel/production.
 */
export function isLocalDevVaultSyncAllowed(scanPath: string): boolean {
  if (process.env.VERCEL === '1') return false
  if (process.env.NODE_ENV !== 'development') return false
  if (process.env.ACCESS_DISABLE_LOCAL_DEV_VAULT_SYNC === 'true') return false
  const trimmed = scanPath.trim()
  if (!trimmed) return false
  return existsSync(trimmed)
}

export function isAccessLocalDevRuntime(): boolean {
  return process.env.VERCEL !== '1' && process.env.NODE_ENV === 'development'
}
