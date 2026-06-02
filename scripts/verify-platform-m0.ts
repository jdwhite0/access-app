/**
 * M0 — Verify Supabase schema for platform milestones.
 * npx tsx scripts/verify-platform-m0.ts
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseUrl } from '../lib/supabase'

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const k = t.slice(0, eq)
    if (!process.env[k]) process.env[k] = t.slice(eq + 1)
  }
}

const REQUIRED_TABLES = [
  'access_identities',
  'vault_connections',
  'sync_runs',
  'connector_devices',
  'connector_pairing_codes',
  'sync_audit_events',
  'sync_jobs',
]

// Each function entry specifies the exact args required by its signature.
// connector_pairing_codes PK is `code` (not `id`) — use select('*') to avoid
// false-negative on column probe.
const REQUIRED_FUNCTION_CALLS: Array<{ name: string; args: Record<string, unknown> }> = [
  {
    name: 'get_registry_summary',
    args: { p_identity_id: '00000000-0000-0000-0000-000000000000' },
  },
  {
    name: 'access_set_request_context',
    args: { p_identity_id: '00000000-0000-0000-0000-000000000000', p_clerk_user_id: 'verify' },
  },
]

async function main() {
  loadEnv()
  const url = resolveSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('FAIL: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const ref = (() => { try { return new URL(url).hostname.split('.')[0] } catch { return url } })()
  console.log(`Supabase project: ${ref}`)

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const report: Record<string, string> = {}

  // Table probe: select('*').limit(0) avoids any column-name dependency.
  // connector_pairing_codes PK is `code`, not `id` — select('id') would
  // return 42703 which incorrectly matched 'does not exist'.
  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(0)
    const msg = error?.message ?? ''
    report[table] =
      error &&
      (error.code === '42P01' ||
        error.code === 'PGRST205' ||
        msg.includes('does not exist') ||
        msg.includes('schema cache'))
        ? 'MISSING'
        : error
          ? `ERR: ${error.message}`
          : 'OK'
  }

  // Function probe: each entry uses its exact required arg signature.
  // Calling access_set_request_context with only p_identity_id returns PGRST202
  // (no matching overload) and was previously flagged as MISSING incorrectly.
  for (const { name, args } of REQUIRED_FUNCTION_CALLS) {
    const { error } = await supabase.rpc(name as 'get_registry_summary', args)
    const msg = error?.message ?? ''
    report[`fn:${name}`] =
      error &&
      (msg.includes('does not exist') ||
        msg.includes('Could not find the function') ||
        error.code === 'PGRST202')
        ? 'MISSING'
        : error
          ? `ERR: ${error.message}`
          : 'OK'
  }

  const missing = Object.entries(report).filter(([, v]) => v === 'MISSING')
  console.log(JSON.stringify({ report, missing: missing.map(([k]) => k) }, null, 2))

  if (missing.length) {
    console.error('\nApply SQL: schema_v3_vault.sql then schema_v4_platform_hardening.sql then schema_v4_m2_tenant_jwt.sql')
    process.exit(1)
  }

  if (!process.env.ACCESS_CONNECTOR_JWT_SECRET?.trim()) {
    console.warn('WARN: ACCESS_CONNECTOR_JWT_SECRET not set (M3)')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    console.warn('WARN: NEXT_PUBLIC_SUPABASE_ANON_KEY not set (M2 tenant RLS path)')
  }
  if (!process.env.SUPABASE_JWT_SECRET?.trim()) {
    console.warn('WARN: SUPABASE_JWT_SECRET not set (M2 tenant RLS path)')
  }

  console.log('M0 verification passed.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
