/**
 * DEV/OPS: Create pairing code for an ACCESS handle (requires service role).
 * Usage: npx tsx scripts/create-connector-pairing-code.ts jdwhite.access
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'

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

async function main() {
  loadEnv()
  const handle = process.argv[2]?.trim()
  if (!handle) {
    console.error('Usage: npx tsx scripts/create-connector-pairing-code.ts <handle>')
    process.exit(1)
  }

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing Supabase env')
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { data: identity } = await supabase
    .from('access_identities')
    .select('id, clerk_user_id')
    .eq('handle', handle)
    .maybeSingle()

  if (!identity) {
    console.error(`Identity not found: ${handle}`)
    process.exit(1)
  }

  const { data: vault } = await supabase
    .from('vault_connections')
    .select('id')
    .eq('identity_id', identity.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const code = randomBytes(3).toString('hex').toUpperCase()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error } = await supabase.from('connector_pairing_codes').insert({
    code,
    identity_id: identity.id,
    clerk_user_id: identity.clerk_user_id,
    vault_connection_id: vault?.id ?? null,
    created_by_clerk: identity.clerk_user_id,
    expires_at: expiresAt,
  })

  if (error) {
    console.error(error.message)
    process.exit(1)
  }

  console.log(JSON.stringify({ ok: true, code, expiresAt, handle }, null, 2))
}

main()
