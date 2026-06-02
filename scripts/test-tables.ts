import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseUrl } from '../lib/supabase'

function loadEnv() {
  for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const k = t.slice(0, eq)
    if (!process.env[k]) process.env[k] = t.slice(eq + 1)
  }
}

async function main() {
  loadEnv()
  const url = resolveSupabaseUrl()!
  const s = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  for (const t of [
    'vault_connections',
    'connector_devices',
    'connector_pairing_codes',
    'sync_audit_events',
    'sync_jobs',
  ]) {
    const r = await s.from(t).select('*').limit(1)
    console.log(t, r.error?.code ?? 'ok', r.error?.message?.slice(0, 80) ?? '')
  }
}

main()
