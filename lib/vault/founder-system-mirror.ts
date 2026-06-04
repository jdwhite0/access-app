import { resolve } from 'node:path'
import {
  DEFAULT_JD_AI_SYSTEM_MONOREPO_ROOT,
  DEFAULT_JD_COMMAND_VAULT_PATH,
  FOUNDER_SYSTEM_MIRROR_DIR,
} from '@/lib/vault/constants'

export { FOUNDER_SYSTEM_MIRROR_DIR }

export function resolveFounderSystemMirrorDir(vaultPath = DEFAULT_JD_COMMAND_VAULT_PATH): string {
  return resolve(vaultPath.trim(), FOUNDER_SYSTEM_MIRROR_DIR)
}

export function resolveFounderMonorepoRoot(
  override?: string,
): string {
  const fromEnv = process.env.ACCESS_MONOREPO_ROOT?.trim()
  if (override?.trim()) return resolve(override.trim())
  if (fromEnv) return resolve(fromEnv)
  return resolve(DEFAULT_JD_AI_SYSTEM_MONOREPO_ROOT)
}
