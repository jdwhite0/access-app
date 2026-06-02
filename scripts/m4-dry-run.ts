/**
 * M4 dry-run — read-only / non-destructive readiness check.
 * Does NOT run sync:apply, pairing inserts, or registry upserts.
 *
 * Usage:
 *   ACCESS_VAULT_ROOT=/path/to/JD_Ai_System npm run m4:dry-run -- jdevinwhite2.access
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseUrl } from '../lib/supabase'

const LOG = '[m4:dry-run]'

type StepResult = {
  pass: boolean
  detail?: string
  blocker?: string
}

function log(msg: string) {
  console.log(`${LOG} ${msg}`)
}

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

const API_BASE = () =>
  (process.env.ACCESS_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

function runConnector(args: string[]): { ok: boolean; stdout: string; stderr: string } {
  const connectorDir = resolve(process.cwd(), 'packages/access-connector')
  const vaultRoot =
    process.env.ACCESS_VAULT_ROOT?.trim() || resolve(process.cwd(), '..')
  const r = spawnSync('npx', ['tsx', 'src/cli.ts', ...args], {
    cwd: connectorDir,
    env: { ...process.env, ACCESS_VAULT_ROOT: vaultRoot, ACCESS_API_BASE_URL: API_BASE() },
    encoding: 'utf8',
  })
  return { ok: r.status === 0, stdout: r.stdout || '', stderr: r.stderr || '' }
}

async function probeTable(
  supabase: ReturnType<typeof createClient>,
  table: string
): Promise<StepResult> {
  // select('*').limit(0) avoids column-name dependency.
  // connector_pairing_codes PK is `code` not `id` — select('id') returned
  // 42703 which matched 'does not exist' and caused a false-negative MISSING.
  const { error } = await supabase.from(table).select('*').limit(0)
  const msg = error?.message ?? ''
  if (
    error &&
    (error.code === '42P01' ||
      error.code === 'PGRST205' ||
      msg.includes('does not exist') ||
      msg.includes('schema cache'))
  ) {
    return { pass: false, blocker: `Table missing: ${table}` }
  }
  if (error) return { pass: false, blocker: msg }
  return { pass: true, detail: 'OK' }
}

async function probeRpc(
  supabase: ReturnType<typeof createClient>,
  fn: string,
  args: Record<string, unknown>
): Promise<StepResult> {
  const { error } = await supabase.rpc(fn, args)
  const msg = error?.message ?? ''
  if (
    error &&
    (msg.includes('does not exist') ||
      msg.includes('Could not find the function') ||
      error.code === 'PGRST202')
  ) {
    return { pass: false, blocker: `RPC missing: ${fn}` }
  }
  if (error && !msg.includes('null value')) {
    return { pass: true, detail: `callable (${error.code ?? 'err'}: ${msg.slice(0, 80)})` }
  }
  return { pass: true, detail: 'OK' }
}

async function main() {
  log('start (non-destructive — sync:apply NOT executed)')
  loadEnv()

  const handle =
    process.argv[2]?.trim() ||
    JSON.parse(
      readFileSync(
        resolve(process.cwd(), 'packages/access-connector/config.local.json'),
        'utf8'
      )
    ).identityHandle ||
    'jdevinwhite2.access'

  const report: Record<string, StepResult> = {}
  const blockers: string[] = []

  const vaultRoot =
    process.env.ACCESS_VAULT_ROOT?.trim() || resolve(process.cwd(), '..')
  const vaultOk = existsSync(vaultRoot)
  report['2_vault_root'] = vaultOk
    ? { pass: true, detail: vaultRoot }
    : { pass: false, blocker: `ACCESS_VAULT_ROOT not found: ${vaultRoot}` }
  log(`vault root: ${vaultRoot} → ${vaultOk ? 'OK' : 'FAIL'}`)

  const tokenPath = resolve(
    process.cwd(),
    'packages/access-connector/.access-connector-token.json'
  )
  let tokenData: {
    deviceId: string
    token: string
    permissions?: string[]
    expiresAt?: string
  } | null = null

  if (!existsSync(tokenPath)) {
    report['1_connector_registered'] = {
      pass: false,
      blocker: 'No .access-connector-token.json — run register first',
    }
    log('connector registered: FAIL (no token file)')
  } else {
    tokenData = JSON.parse(readFileSync(tokenPath, 'utf8'))
    const exp = tokenData.expiresAt ? new Date(tokenData.expiresAt).getTime() : 0
    const expired = exp > 0 && exp < Date.now()
    report['1_connector_registered'] = expired
      ? { pass: false, blocker: 'Device token expired — re-register' }
      : {
          pass: true,
          detail: `deviceId=${tokenData.deviceId}, permissions=${(tokenData.permissions ?? []).join(',')}`,
        }
    log(`connector registered: ${expired ? 'FAIL (expired)' : 'OK'}`)
  }

  const url = resolveSupabaseUrl()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceKey) {
    report['6_supabase_tables'] = {
      pass: false,
      blocker: 'Supabase env missing in .env.local',
    }
    blockers.push('Supabase env')
  } else {
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
    const ref = new URL(url).hostname.split('.')[0]
    log(`Supabase project: ${ref}`)

    const tables = [
      'vault_connections',
      'sync_runs',
      'connector_devices',
      'connector_pairing_codes',
      'sync_audit_events',
      'sync_jobs',
    ]
    const tableResults: Record<string, string> = {}
    let tablesPass = true
    for (const t of tables) {
      const r = await probeTable(supabase, t)
      tableResults[t] = r.pass ? 'OK' : (r.blocker ?? 'FAIL')
      if (!r.pass) tablesPass = false
    }
    report['6_supabase_tables'] = tablesPass
      ? { pass: true, detail: Object.entries(tableResults).map(([k, v]) => `${k}=${v}`).join('; ') }
      : { pass: false, blocker: Object.entries(tableResults).filter(([, v]) => v !== 'OK').map(([k, v]) => `${k}:${v}`).join(', ') }

    const fnCtx = await probeRpc(supabase, 'access_set_request_context', {
      p_identity_id: '00000000-0000-0000-0000-000000000000',
      p_clerk_user_id: 'dry-run',
    })
    const fnSummary = await probeRpc(supabase, 'get_registry_summary', {
      p_identity_id: '00000000-0000-0000-0000-000000000000',
    })
    report['6b_supabase_rpcs'] = {
      pass: fnCtx.pass && fnSummary.pass,
      detail: `access_set_request_context=${fnCtx.pass ? 'OK' : fnCtx.blocker}; get_registry_summary=${fnSummary.pass ? 'OK' : fnSummary.blocker}`,
      blocker:
        !fnCtx.pass || !fnSummary.pass
          ? [fnCtx.blocker, fnSummary.blocker].filter(Boolean).join('; ')
          : undefined,
    }

    if (tokenData?.deviceId) {
      const { data: device, error: devErr } = await supabase
        .from('connector_devices')
        .select('id, status, last_seen_at, permissions')
        .eq('id', tokenData.deviceId)
        .maybeSingle()
      report['1b_device_row'] = devErr
        ? { pass: false, blocker: devErr.message }
        : device
          ? { pass: device.status === 'active', detail: `status=${device.status}` }
          : { pass: false, blocker: 'Device row not in connector_devices' }
    }

    const { data: identity } = await supabase
      .from('access_identities')
      .select('id')
      .eq('handle', handle)
      .maybeSingle()

    if (identity) {
      const { count } = await supabase
        .from('systems')
        .select('id', { count: 'exact', head: true })
        .eq('identity_id', identity.id)
        .not('source_ref', 'is', null)
      report['registry_provenance_rows'] = {
        pass: true,
        detail: `systems with source_ref (read-only count): ${count ?? 0}`,
      }
    }
  }

  for (const [step, cmd] of [
    ['3_scan', 'scan'],
    ['4_compile', 'compile'],
    ['5_sync_plan', 'sync-plan'],
  ] as const) {
    const r = runConnector([cmd])
    report[step] = r.ok
      ? { pass: true, detail: 'exit 0' }
      : { pass: false, blocker: (r.stderr || r.stdout).slice(0, 200) }
    log(`${cmd}: ${r.ok ? 'OK' : 'FAIL'}`)
  }

  const planPath = resolve(
    process.cwd(),
    'packages/access-connector/registry-sync-plan.json'
  )
  if (existsSync(planPath)) {
    const plan = JSON.parse(readFileSync(planPath, 'utf8')) as {
      applyToCloud?: boolean
      planned?: unknown[]
    }
    report['5b_sync_plan_artifact'] = {
      pass: plan.applyToCloud === false && Array.isArray(plan.planned) && plan.planned.length > 0,
      detail: `applyToCloud=${plan.applyToCloud}, planned=${plan.planned?.length ?? 0} rows`,
    }
  }

  const perms = tokenData?.permissions ?? []
  const hasApplyPerm = perms.includes('sync:apply')
  report['8_sync_apply_available'] = {
    pass: hasApplyPerm && existsSync(resolve(process.cwd(), 'app/api/connector/v1/sync/apply/route.ts')),
    detail: hasApplyPerm
      ? 'permission sync:apply present; route file exists'
      : 'missing sync:apply permission on device token',
  }
  report['8_sync_apply_executed'] = {
    pass: true,
    detail: 'SKIPPED by design (dry-run)',
  }

  let authOk = false
  if (tokenData?.token) {
    try {
      const health = await fetch(`${API_BASE()}/`, { signal: AbortSignal.timeout(5000) })
      if (!health.ok) {
        report['7_connector_auth'] = {
          pass: false,
          blocker: `API not reachable at ${API_BASE()} — start npm run dev`,
        }
      } else {
        const hb = await fetch(`${API_BASE()}/api/connector/v1/heartbeat`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenData.token}` },
          signal: AbortSignal.timeout(10000),
        })
        const body = await hb.json().catch(() => ({}))
        authOk = hb.ok
        report['7_connector_auth'] = hb.ok
          ? { pass: true, detail: `heartbeat ${hb.status}` }
          : {
              pass: false,
              blocker: `heartbeat ${hb.status}: ${(body as { error?: string }).error ?? JSON.stringify(body)}`,
            }

        if (hb.ok) {
          const probe = await fetch(`${API_BASE()}/api/connector/v1/sync/apply`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokenData.token}`,
              'Content-Type': 'application/json',
            },
            body: '{}',
            signal: AbortSignal.timeout(10000),
          })
          const probeBody = (await probe.json().catch(() => ({}))) as {
            ok?: boolean
            syncRunId?: string | null
            error?: string
          }
          const noRun =
            probeBody.syncRunId == null &&
            (probe.status === 400 || probe.status === 422 || probeBody.ok === false)
          report['8b_sync_apply_route_probe'] = noRun
            ? {
                pass: true,
                detail: `POST /sync/apply returned ${probe.status} without syncRunId (validation only)`,
              }
            : {
                pass: false,
                blocker: `Unexpected apply response: status=${probe.status} syncRunId=${probeBody.syncRunId}`,
              }
        }
      }
    } catch (e) {
      report['7_connector_auth'] = {
        pass: false,
        blocker: e instanceof Error ? e.message : String(e),
      }
    }
    log(`connector auth (heartbeat): ${authOk ? 'OK' : 'FAIL/SKIP'}`)
  } else {
    report['7_connector_auth'] = { pass: false, blocker: 'No token for heartbeat' }
  }

  for (const [, v] of Object.entries(report)) {
    if (!v.pass && v.blocker) blockers.push(v.blocker)
  }

  const ready =
    Object.entries(report)
      .filter(([k]) => k !== '8_sync_apply_executed' && k !== 'registry_provenance_rows')
      .every(([, v]) => v.pass) && blockers.length === 0

  const outDir = resolve(process.cwd(), 'docs/evidence/m4')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(
    join(outDir, 'm4-dry-run-result.json'),
    JSON.stringify({ handle, vaultRoot, at: new Date().toISOString(), ready, report, blockers }, null, 2)
  )

  console.log('')
  log(ready ? 'READY for approved sync:apply' : 'NOT READY for approved sync:apply')
  if (blockers.length) {
    console.error(`${LOG} blockers:`)
    for (const b of [...new Set(blockers)]) console.error(`  - ${b}`)
  }
  console.log(`${LOG} artifact: docs/evidence/m4/m4-dry-run-result.json`)
  console.log('')

  process.exit(ready ? 0 : 1)
}

main().catch((e) => {
  console.error(`${LOG} fatal:`, e)
  process.exit(1)
})
