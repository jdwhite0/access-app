import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/** Load access-app/.env.local into process.env (CLI scripts only). */
export function loadAccessEnv(): void {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const k = t.slice(0, eq)
    if (!process.env[k]) process.env[k] = t.slice(eq + 1)
  }
}

export function jdaiContentEngineRoot(): string {
  if (process.env.JDAI_CONTENT_ENGINE_PATH?.trim()) {
    return resolve(process.env.JDAI_CONTENT_ENGINE_PATH.trim())
  }
  return resolve(process.cwd(), '../jdai-content-engine')
}
