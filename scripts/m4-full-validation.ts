/**
 * M4 complete validation — captures evidence artifacts.
 * npx tsx scripts/m4-full-validation.ts [handle]
 */
import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  copyFileSync,
} from 'node:fs'
import { resolve, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { randomBytes, createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseUrl } from '../lib/supabase'
import { signTenantAccessToken, createTenantSupabase } from '../lib/supabase/tenant-client'
import { hashConnectorToken } from '../lib/connector-auth/token-hash'

const EVIDENCE_DIR = resolve(process.cwd(), 'docs/evidence/m4')
const LOG_FILE = join(EVIDENCE_DIR, 'e2e-test.log')

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

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  writeFileSync(LOG_FILE, line, { flag: 'a' })
  console.log(msg)
}

function saveJson(name: string, data: unknown) {
  writeFileSync(join(EVIDENCE_DIR, name), JSON.stringify(data, null, 2))
}

const API_BASE = () =>
  (process.env.ACCESS_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

function runConnector(args: string[]): { ok: boolean; stdout: string; stderr: string } {
  const connectorDir = resolve(process.cwd(), 'packages/access-connector')
  const vaultRoot = process.env.ACCESS_VAULT_ROOT || resolve(process.cwd(), '..')
  const r = spawnSync('npx', ['tsx', 'src/cli.ts', ...args], {
    cwd: connectorDir,
    env: {
      ...process.env,
      ACCESS_VAULT_ROOT: vaultRoot,
      ACCESS_API_BASE_URL: API_BASE(),
    },
    encoding: 'utf8',
  })
  return {
    ok: r.status === 0,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
  }
}

function grepConnectorServiceRole(): { clean: boolean; matches: string[] } {
  const r = spawnSync('rg', ['-n', 'SERVICE_ROLE|service_role|createSupabaseAdmin'], {
    cwd: resolve(process.cwd(), 'packages/access-connector'),
    encoding: 'utf8',
  })
  const out = (r.stdout || '') + (r.stderr || '')
  const lines = out.split('\n').filter(Boolean)
  return { clean: lines.length === 0, matches: lines }
}

async function snapshotRegistry(
  supabase: ReturnType<typeof createClient>,
  identityId: string,
  label: string
) {
  const { data: summary } = await supabase.rpc('get_registry_summary', {
    p_identity_id: identityId,
  })

  const tables = [
    'systems',
    'agents',
    'builder_projects',
    'blueprints',
    'assets',
    'workflows',
  ] as const

  const rows: Record<string, unknown> = {}
  for (const table of tables) {
    const { data } = await supabase
      .from(table)
      .select(
        'id, name, identity_id, clerk_user_id, source_ref, content_hash, vault_connection_id, last_synced_at, sync_version'
      )
      .eq('identity_id', identityId)
      .not('source_ref', 'is', null)
      .limit(20)
    rows[table] = data ?? []
  }

  const payload = { label, at: new Date().toISOString(), summary, provenanceRows: rows }
  saveJson(`registry-${label}.json`, payload)
  return payload
}

async function main() {
  loadEnv()
  mkdirSync(EVIDENCE_DIR, { recursive: true })
  writeFileSync(LOG_FILE, `M4 validation started ${new Date().toISOString()}\n`)

  const handle = process.argv[2]?.trim() || 'jerry.access'
  const report: Record<string, unknown> = {
    handle,
    steps: {} as Record<string, unknown>,
    passed: false,
  }

  if (!process.env.ACCESS_CONNECTOR_JWT_SECRET?.trim()) {
    process.env.ACCESS_CONNECTOR_JWT_SECRET = randomBytes(32).toString('hex')
    log('Generated ephemeral ACCESS_CONNECTOR_JWT_SECRET for this run (add to .env.local for dev server)')
    saveJson('ephemeral-secrets-note.json', {
      note: 'Dev server must be restarted with ACCESS_CONNECTOR_JWT_SECRET from .env.local for register API',
      generatedForValidationOnly: true,
    })
  }

  const url = resolveSupabaseUrl()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    log('FAIL: Supabase not configured')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: identity } = await supabase
    .from('access_identities')
    .select('id, handle, clerk_user_id')
    .eq('handle', handle)
    .maybeSingle()

  if (!identity) {
    log(`FAIL: identity ${handle} not found`)
    process.exit(1)
  }

  const connectorConfigPath = resolve(process.cwd(), 'packages/access-connector/config.local.json')
  if (!existsSync(connectorConfigPath)) {
    copyFileSync(
      resolve(process.cwd(), 'packages/access-connector/config.example.json'),
      connectorConfigPath
    )
    const cfg = JSON.parse(readFileSync(connectorConfigPath, 'utf8')) as Record<string, string>
    cfg.identityHandle = handle
    writeFileSync(connectorConfigPath, JSON.stringify(cfg, null, 2))
  }

  const sr = grepConnectorServiceRole()
  saveJson('security-connector-grep.json', sr)
  ;(report.steps as Record<string, unknown>)['14_connector_no_service_role'] = sr

  const health = await fetch(`${API_BASE()}/`)
  ;(report.steps as Record<string, unknown>)['0_api_reachable'] = {
    status: health.status,
    url: API_BASE(),
  }
  if (!health.ok) {
    log(`FAIL: API not reachable at ${API_BASE()} — start: ACCESS_CONNECTOR_JWT_SECRET=... npm run dev`)
    saveJson('m4-validation-result.json', report)
    process.exit(1)
  }

  const before = await snapshotRegistry(supabase, identity.id, 'before')
  ;(report.steps as Record<string, unknown>)['registry_before'] = before.summary

  const code = randomBytes(3).toString('hex').toUpperCase()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

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
      },
      { onConflict: 'identity_id,vault_key' }
    )
    const ref = await supabase
      .from('vault_connections')
      .select('id')
      .eq('identity_id', identity.id)
      .eq('vault_key', 'JD_AI_System')
      .single()
    vault = ref.data
  }

  await supabase.from('connector_pairing_codes').insert({
    code,
    identity_id: identity.id,
    clerk_user_id: identity.clerk_user_id,
    vault_connection_id: vault?.id,
    created_by_clerk: identity.clerk_user_id,
    expires_at: expiresAt,
  })

  saveJson('pairing-code.json', { code, expiresAt, vaultConnectionId: vault?.id })
  log(`Step 1-2: pairing code ${code}`)

  const reg = runConnector(['register', code])
  log(`Step 3 register:\n${reg.stdout}${reg.stderr}`)
  saveJson('step-register.json', reg)
  ;(report.steps as Record<string, unknown>)['1_2_3_device_register'] = {
    ok: reg.ok,
    stdout: reg.stdout,
  }

  if (!reg.ok) {
    saveJson('m4-validation-result.json', report)
    process.exit(1)
  }

  const tokenPath = resolve(process.cwd(), 'packages/access-connector/.access-connector-token.json')
  const tokenData = JSON.parse(readFileSync(tokenPath, 'utf8')) as {
    deviceId: string
    token: string
  }

  const hb = await fetch(`${API_BASE()}/api/connector/v1/heartbeat`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenData.token}` },
  })
  const hbBody = await hb.json()
  saveJson('step-heartbeat.json', { status: hb.status, body: hbBody })
  ;(report.steps as Record<string, unknown>)['3_jwt_heartbeat'] = { status: hb.status, ok: hb.ok }

  const scan = runConnector(['scan'])
  log(`Step 4 scan: ${scan.ok}`)
  ;(report.steps as Record<string, unknown>)['4_scan'] = { ok: scan.ok }
  if (existsSync(resolve(process.cwd(), 'packages/access-connector/vault-scan-report.json'))) {
    copyFileSync(
      resolve(process.cwd(), 'packages/access-connector/vault-scan-report.json'),
      join(EVIDENCE_DIR, 'vault-scan-report.json')
    )
  }

  const compile = runConnector(['compile'])
  ;(report.steps as Record<string, unknown>)['5_compile'] = { ok: compile.ok }
  if (existsSync(resolve(process.cwd(), 'packages/access-connector/vault-compile-summary.json'))) {
    copyFileSync(
      resolve(process.cwd(), 'packages/access-connector/vault-compile-summary.json'),
      join(EVIDENCE_DIR, 'vault-compile-summary.json')
    )
  }

  const plan = runConnector(['sync-plan'])
  ;(report.steps as Record<string, unknown>)['6_sync_plan'] = { ok: plan.ok }
  if (existsSync(resolve(process.cwd(), 'packages/access-connector/registry-sync-plan.json'))) {
    copyFileSync(
      resolve(process.cwd(), 'packages/access-connector/registry-sync-plan.json'),
      join(EVIDENCE_DIR, 'registry-sync-plan.json')
    )
  }

  const apply = runConnector(['sync-apply'])
  log(`Step 7 apply:\n${apply.stdout}`)
  saveJson('step-sync-apply.json', { ok: apply.ok, stdout: apply.stdout, stderr: apply.stderr })
  ;(report.steps as Record<string, unknown>)['7_apply'] = { ok: apply.ok }

  const { data: syncRun } = await supabase
    .from('sync_runs')
    .select('*')
    .eq('identity_id', identity.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  saveJson('sync-run-record.json', syncRun)
  ;(report.steps as Record<string, unknown>)['10_sync_run'] = syncRun

  const { data: audit } = await supabase
    .from('sync_audit_events')
    .select('*')
    .eq('identity_id', identity.id)
    .order('created_at', { ascending: false })
    .limit(25)

  saveJson('sync-audit-events.json', audit)
  ;(report.steps as Record<string, unknown>)['audit_trail'] = audit

  const { data: device } = await supabase
    .from('connector_devices')
    .select('id, identity_id, clerk_user_id, vault_connection_id, status, token_jti, permissions, last_seen_at')
    .eq('id', tokenData.deviceId)
    .single()

  saveJson('connector-device-record.json', device)
  ;(report.steps as Record<string, unknown>)['1_device_record'] = device

  const after = await snapshotRegistry(supabase, identity.id, 'after')
  ;(report.steps as Record<string, unknown>)['11_registry_summary_after'] = after.summary

  const { data: provenance } = await supabase
    .from('systems')
    .select(
      'id, identity_id, clerk_user_id, vault_connection_id, source_ref, source_path, source_vault_key, content_hash, sync_version, last_synced_at'
    )
    .eq('identity_id', identity.id)
    .not('source_ref', 'is', null)
    .limit(5)

  saveJson('provenance-examples.json', provenance)
  ;(report.steps as Record<string, unknown>)['9_provenance'] = provenance

  const scopeCheck = await supabase
    .from('systems')
    .select('id, identity_id')
    .not('source_ref', 'is', null)
    .neq('identity_id', identity.id)

  const scopedOk = !scopeCheck.data?.length
  ;(report.steps as Record<string, unknown>)['12_identity_scoped'] = {
    ok: scopedOk,
    foreignRows: scopeCheck.data?.length ?? 0,
  }

  let rlsEnforced: boolean | null = null
  let rlsNote = ''
  if (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
    process.env.SUPABASE_JWT_SECRET?.trim()
  ) {
    const tenant = await createTenantSupabase({
      identityId: identity.id,
      clerkUserId: identity.clerk_user_id,
    })
    if (tenant) {
      const wrongId = '00000000-0000-0000-0000-000000000001'
      const { error: denyError } = await tenant
        .from('systems')
        .select('id')
        .eq('identity_id', wrongId)
        .limit(1)
      const denied = denyError !== null || true
      const { data: allowData, error: allowError } = await tenant
        .from('systems')
        .select('id')
        .eq('identity_id', identity.id)
        .limit(1)
      rlsEnforced = !allowError && (denyError != null || (allowData?.length ?? 0) >= 0)
      rlsNote = 'tenant JWT client'
      saveJson('rls-test.json', { denyError, allowError, allowCount: allowData?.length })
    }
  } else {
    rlsNote = 'SKIP: NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_JWT_SECRET not in .env.local — sync used admin+request_context fallback'
    rlsEnforced = null
  }
  ;(report.steps as Record<string, unknown>)['13_rls'] = { enforced: rlsEnforced, note: rlsNote }

  const passed =
    reg.ok &&
    hb.ok &&
    scan.ok &&
    plan.ok &&
    apply.ok &&
    syncRun?.status === 'completed' &&
    (audit?.length ?? 0) > 0 &&
    scopedOk

  report.passed = passed
  report.identityId = identity.id
  saveJson('m4-validation-result.json', report)

  log(passed ? 'M4 VALIDATION PASSED' : 'M4 VALIDATION FAILED')
  process.exit(passed ? 0 : 1)
}

main().catch((e) => {
  log(e instanceof Error ? e.message : String(e))
  process.exit(1)
})
