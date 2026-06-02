import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { AccessConnectorConfig } from './types.js'
import { DEFAULT_VAULT_KEY } from './types.js'

export function loadConnectorConfig(configPath?: string): AccessConnectorConfig {
  const path = configPath ?? resolve(process.cwd(), 'config.local.json')
  const raw = readFileSync(path, 'utf8')
  const parsed = JSON.parse(raw) as Partial<AccessConnectorConfig>

  return {
    vaultKey: parsed.vaultKey ?? DEFAULT_VAULT_KEY,
    identityHandle: parsed.identityHandle ?? '',
    displayName: parsed.displayName,
    machineId: parsed.machineId ?? process.env.ACCESS_CONNECTOR_MACHINE_ID,
    compileProfile: parsed.compileProfile,
  }
}

/** Load non-secret env from parent app (API URL only — never service role). */
export function loadEnvFromAccessApp(): void {
  const candidates = [
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '../../.env.local'),
  ]
  const allow = new Set(['ACCESS_API_BASE_URL', 'NEXT_PUBLIC_VERCEL_URL'])
  for (const envPath of candidates) {
    try {
      for (const line of readFileSync(envPath, 'utf8').split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eq = trimmed.indexOf('=')
        if (eq < 1) continue
        const key = trimmed.slice(0, eq)
        if (!allow.has(key)) continue
        let val = trimmed.slice(eq + 1)
        if (val.startsWith('"')) {
          val = val.slice(1)
          if (val.endsWith('"')) val = val.slice(0, -1)
        }
        if (!process.env[key]) process.env[key] = val
      }
      return
    } catch {
      /* try next */
    }
  }
}

export function validateConnectorConfig(
  config: AccessConnectorConfig
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = []
  if (!config.vaultKey?.trim()) errors.push('vaultKey is required')
  if (!config.identityHandle?.trim()) errors.push('identityHandle is required')
  if (config.identityHandle?.includes('/')) {
    errors.push('identityHandle must not contain path characters')
  }
  if (config.vaultKey?.includes('/')) {
    errors.push('vaultKey must not contain path characters')
  }
  return errors.length ? { ok: false, errors } : { ok: true }
}
