/**
 * DEV/OPS: Create pairing code for an ACCESS handle (requires service role).
 *
 * Command syntax (handle required after `--`):
 *   npm run pairing:code -- jdevinwhite2.access
 *
 * Direct:
 *   npx tsx scripts/create-connector-pairing-code.ts jdevinwhite2.access
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { resolveSupabaseUrl } from '../lib/supabase'

const LOG = '[pairing:code]'

function log(message: string) {
  console.log(`${LOG} ${message}`)
}

function fail(message: string, detail?: string) {
  console.error(`${LOG} ERROR: ${message}`)
  if (detail) console.error(`${LOG}        ${detail}`)
  process.exit(1)
}

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  try {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq < 1) continue
      const k = t.slice(0, eq)
      if (!process.env[k]) process.env[k] = t.slice(eq + 1)
    }
    log(`env loaded from ${envPath}`)
  } catch (err) {
    fail(
      'Could not read .env.local',
      err instanceof Error ? err.message : String(err)
    )
  }
}

function resolveHandle(): string {
  const fromArgv = process.argv.slice(2).find((a) => a && !a.startsWith('-'))?.trim()
  const fromEnv = process.env.PAIRING_HANDLE?.trim()
  const handle = fromArgv || fromEnv || ''
  if (!handle) {
    fail(
      'Missing ACCESS handle.',
      'Usage: npm run pairing:code -- <handle>   (example: npm run pairing:code -- jdevinwhite2.access)'
    )
  }
  return handle
}

function projectRefFromUrl(url: string): string {
  try {
    return new URL(url).hostname.split('.')[0]
  } catch {
    return url
  }
}

async function main() {
  log('start')

  loadEnv()

  const handle = resolveHandle()
  log(`handle: ${handle}`)

  const url = resolveSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url) {
    fail(
      'Supabase URL not configured.',
      'Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL in access-app/.env.local'
    )
  }
  if (!key) {
    fail(
      'SUPABASE_SERVICE_ROLE_KEY not set.',
      'Add it to access-app/.env.local (server-only secret).'
    )
  }

  log(`Supabase project: ${projectRefFromUrl(url)} (${url})`)

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { error: tableError } = await supabase
    .from('connector_pairing_codes')
    .select('code')
    .limit(1)

  if (tableError) {
    const msg = tableError.message ?? ''
    if (
      tableError.code === '42P01' ||
      tableError.code === 'PGRST205' ||
      msg.includes('does not exist') ||
      msg.includes('schema cache')
    ) {
      fail(
        'Table connector_pairing_codes is missing.',
        'Apply supabase/schema_v4_platform_hardening.sql then run npm run platform:verify-m0'
      )
    }
    fail('Could not reach connector_pairing_codes.', msg)
  }

  log('connector_pairing_codes table: OK')

  const { data: identity, error: identityError } = await supabase
    .from('access_identities')
    .select('id, clerk_user_id')
    .eq('handle', handle)
    .maybeSingle()

  if (identityError) {
    fail('Identity lookup failed.', identityError.message)
  }
  if (!identity) {
    fail(`Identity not found for handle "${handle}".`, 'Sign in once in the app or seed access_identities.')
  }

  log(`identity found: ${identity.id}`)

  const { data: vault, error: vaultError } = await supabase
    .from('vault_connections')
    .select('id, vault_key')
    .eq('identity_id', identity.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (vaultError) {
    fail('vault_connections lookup failed.', vaultError.message)
  }

  if (vault?.id) {
    log(`vault_connection: ${vault.vault_key ?? vault.id}`)
  } else {
    log('vault_connection: none (pairing code will still be created)')
  }

  const code = randomBytes(3).toString('hex').toUpperCase()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { error: insertError } = await supabase.from('connector_pairing_codes').insert({
    code,
    identity_id: identity.id,
    clerk_user_id: identity.clerk_user_id,
    vault_connection_id: vault?.id ?? null,
    created_by_clerk: identity.clerk_user_id,
    expires_at: expiresAt,
  })

  if (insertError) {
    fail('Failed to insert pairing code.', insertError.message)
  }

  log('pairing code created')
  console.log('')
  console.log(JSON.stringify({ ok: true, code, expiresAt, handle, identityId: identity.id }, null, 2))
  console.log('')
  console.log(`${LOG} Register with:`)
  console.log(`  cd packages/access-connector && npm run register -- ${code}`)
  console.log('')

  process.exit(0)
}

main().catch((err) => {
  fail('Unexpected error.', err instanceof Error ? err.message : String(err))
})
