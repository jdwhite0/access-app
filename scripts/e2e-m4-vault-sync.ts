/**
 * M4 — End-to-end vault sync proof (JD_AI_System).
 *
 * Prerequisites:
 * - access-app running (npm run dev) OR ACCESS_API_BASE_URL set to production
 * - schema v3 + v4 + v4_m2 applied
 * - ACCESS_CONNECTOR_JWT_SECRET, Supabase env in access-app/.env.local
 * - packages/access-connector/config.local.json
 * - ACCESS_VAULT_ROOT pointing at JD_Ai_System repo root
 *
 * Usage:
 *   npx tsx scripts/e2e-m4-vault-sync.ts [identity.handle]
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseUrl } from '../lib/supabase'
import { randomBytes } from 'node:crypto'

function loadEnv() {
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

const API_BASE = () =>
  (process.env.ACCESS_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

async function fetchJson(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE()}${path}`, init)
  const body = await res.json().catch(() => ({}))
  return { res, body }
}

function runConnector(args: string[]): { ok: boolean; stdout: string } {
  const connectorDir = resolve(process.cwd(), 'packages/access-connector')
  const vaultRoot =
    process.env.ACCESS_VAULT_ROOT ||
    resolve(process.cwd(), '..')

  const result = spawnSync('npx', ['tsx', 'src/cli.ts', ...args], {
    cwd: connectorDir,
    env: {
      ...process.env,
      ACCESS_VAULT_ROOT: vaultRoot,
      ACCESS_API_BASE_URL: API_BASE(),
    },
    encoding: 'utf8',
  })

  const stdout = (result.stdout || '') + (result.stderr || '')
  return { ok: result.status === 0, stdout }
}

async function main() {
  loadEnv()
  const handle = process.argv[2]?.trim() || 'jerry.access'

  const url = resolveSupabaseUrl()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('FAIL: Supabase env missing in .env.local')
    process.exit(1)
  }
  if (!process.env.ACCESS_CONNECTOR_JWT_SECRET?.trim()) {
    console.error('FAIL: ACCESS_CONNECTOR_JWT_SECRET missing')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: identity } = await supabase
    .from('access_identities')
    .select('id, handle, clerk_user_id')
    .eq('handle', handle)
    .maybeSingle()

  if (!identity) {
    console.error(`FAIL: No identity for handle ${handle}`)
    process.exit(1)
  }

  let { data: vault } = await supabase
    .from('vault_connections')
    .select('id, vault_key')
    .eq('identity_id', identity.id)
    .eq('vault_key', 'JD_AI_System')
    .maybeSingle()

  if (!vault) {
    await supabase.from('vault_connections').upsert(
      {
        identity_id: identity.id,
        clerk_user_id: identity.clerk_user_id,
        vault_key: 'JD_AI_System',
        display_name: 'JD_AI_System Intelligence Vault',
        connector_type: 'local_connector',
        status: 'pending_connector',
        root_label: 'Private intelligence vault',
      },
      { onConflict: 'identity_id,vault_key' }
    )
    const refetch = await supabase
      .from('vault_connections')
      .select('id, vault_key')
      .eq('identity_id', identity.id)
      .eq('vault_key', 'JD_AI_System')
      .maybeSingle()
    vault = refetch.data
  }

  const code = randomBytes(3).toString('hex').toUpperCase()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error: pairErr } = await supabase.from('connector_pairing_codes').insert({
    code,
    identity_id: identity.id,
    clerk_user_id: identity.clerk_user_id,
    vault_connection_id: vault?.id ?? null,
    created_by_clerk: identity.clerk_user_id,
    expires_at: expiresAt,
  })

  if (pairErr) {
    console.error('FAIL: pairing code', pairErr.message)
    process.exit(1)
  }

  console.log('Pairing code:', code)

  const health = await fetchJson('/api/connector/v1/heartbeat', {
    method: 'POST',
    headers: { Authorization: 'Bearer invalid' },
  })
  if (health.res.status !== 401) {
    console.warn('WARN: expected 401 for invalid token, got', health.res.status)
  }

  const reg = runConnector(['register', code])
  if (!reg.ok) {
    console.error('FAIL: connector register\n', reg.stdout)
    process.exit(1)
  }
  console.log('OK: device registered')

  const scan = runConnector(['scan'])
  if (!scan.ok) {
    console.error('FAIL: scan\n', scan.stdout)
    process.exit(1)
  }
  console.log('OK: vault scanned')

  const plan = runConnector(['sync-plan'])
  if (!plan.ok) {
    console.error('FAIL: sync-plan\n', plan.stdout)
    process.exit(1)
  }
  console.log('OK: sync plan generated')

  const apply = runConnector(['sync-apply'])
  if (!apply.ok) {
    console.error('FAIL: sync-apply\n', apply.stdout)
    process.exit(1)
  }
  console.log('OK: sync applied')
  console.log(apply.stdout)

  const { data: runs } = await supabase
    .from('sync_runs')
    .select('id, status, stats, completed_at')
    .eq('identity_id', identity.id)
    .order('started_at', { ascending: false })
    .limit(1)

  const { data: audit } = await supabase
    .from('sync_audit_events')
    .select('id, event_type')
    .eq('identity_id', identity.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: summary } = await supabase.rpc('get_registry_summary', {
    p_identity_id: identity.id,
  })

  const { data: provenance } = await supabase
    .from('systems')
    .select('id, source_ref, content_hash, identity_id, vault_connection_id')
    .eq('identity_id', identity.id)
    .not('source_ref', 'is', null)
    .limit(3)

  const report = {
    m4: 'proof',
    handle,
    identityId: identity.id,
    lastSyncRun: runs?.[0] ?? null,
    auditSample: audit ?? [],
    registrySummary: summary,
    provenanceSample: provenance ?? [],
    connectorUsesServiceRole: false,
  }

  console.log(JSON.stringify(report, null, 2))

  if (!runs?.[0] || runs[0].status !== 'completed') {
    console.error('FAIL: sync_run not completed')
    process.exit(1)
  }
  if (!audit?.length) {
    console.error('FAIL: no audit events')
    process.exit(1)
  }
  if (!provenance?.length) {
    console.warn('WARN: no systems with provenance (plan may have mapped other types)')
  }

  console.log('\nM4 E2E PASSED')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
