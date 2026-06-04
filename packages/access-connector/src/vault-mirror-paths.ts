import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Canonical monorepo root (macOS: JD_AI_System resolves here). */
export const DEFAULT_MONOREPO_ROOT = '/Users/jdproductions/Documents/JD_Ai_System'

export const DEFAULT_VAULT_PATH = `${DEFAULT_MONOREPO_ROOT}/JD Command Vault`

export const SYSTEM_MIRROR_DIR = 'system_mirror'

const CONNECTOR_PKG = dirname(fileURLToPath(import.meta.url))

export function resolveMonorepoRoot(override?: string): string {
  const fromEnv = process.env.ACCESS_MONOREPO_ROOT?.trim()
  if (override?.trim()) return resolve(override.trim())
  if (fromEnv) return resolve(fromEnv)
  const fromCwd = process.cwd()
  if (existsSync(resolve(fromCwd, 'access-app', 'package.json'))) {
    return resolve(fromCwd)
  }
  if (existsSync(resolve(fromCwd, 'package.json')) && fromCwd.endsWith('access-app')) {
    return resolve(fromCwd, '..')
  }
  if (existsSync(resolve(CONNECTOR_PKG, '../../../package.json'))) {
    return resolve(CONNECTOR_PKG, '../../..')
  }
  return resolve(DEFAULT_MONOREPO_ROOT)
}

export function resolveVaultPath(override?: string): string {
  const fromEnv = process.env.ACCESS_VAULT_ROOT?.trim()
  if (override?.trim()) return resolve(override.trim())
  if (fromEnv) return resolve(fromEnv)
  return resolve(DEFAULT_VAULT_PATH)
}

export function resolveSystemMirrorDir(vaultPath?: string): string {
  return resolve(resolveVaultPath(vaultPath), SYSTEM_MIRROR_DIR)
}
