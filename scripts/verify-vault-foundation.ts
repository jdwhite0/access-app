/**
 * Verify Phase 3a vault tables (no secrets printed).
 * Run: npx tsx scripts/verify-vault-foundation.ts
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq)
    let val = trimmed.slice(eq + 1)
    if (val.startsWith('"')) {
      val = val.slice(1)
      if (val.endsWith('"')) val = val.slice(0, -1)
      val = val.replace(/\\n/g, '\n').replace(/\\"/g, '"')
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

async function main() {
  try {
    loadEnvLocal()
  } catch {
    console.log(JSON.stringify({ ok: false, reason: 'missing .env.local' }))
    process.exit(1)
  }

  const { createSupabaseAdmin } = await import('../lib/supabase')
  const client = createSupabaseAdmin()
  if (!client) {
    console.log(JSON.stringify({ ok: false, reason: 'supabase not configured' }))
    process.exit(1)
  }

  const vault = await client.from('vault_connections').select('id').limit(1)
  const sync = await client.from('sync_runs').select('id').limit(1)

  const jerryByHandle = await client
    .from('access_identities')
    .select('id, handle, clerk_user_id')
    .in('handle', ['jerry.access', 'jdwhite.access'])

  let jerryVault: unknown = null
  if (jerryByHandle.data?.length) {
    const ids = jerryByHandle.data.map((r) => r.clerk_user_id)
    const { data } = await client
      .from('vault_connections')
      .select('vault_key, display_name, status, last_sync_at')
      .in('clerk_user_id', ids)
    jerryVault = data
  }

  console.log(
    JSON.stringify(
      {
        vault_connections_table: vault.error
          ? { ok: false, message: vault.error.message }
          : { ok: true },
        sync_runs_table: sync.error
          ? { ok: false, message: sync.error.message }
          : { ok: true },
        jerry_identities: jerryByHandle.data?.map((r) => r.handle) ?? [],
        jerry_vault_rows: jerryVault,
      },
      null,
      2
    )
  )

  if (vault.error || sync.error) process.exit(1)
}

main().catch((e) => {
  console.error(String(e))
  process.exit(1)
})
