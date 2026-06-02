import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { resolveSupabaseUrl } from '../lib/supabase'
import { isConnectorJwtConfigured } from '../lib/connector-auth/jwt'

function loadEnv() {
  const p = resolve(process.cwd(), '.env.local')
  for (const line of readFileSync(p, 'utf8').split('\n')) {
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
  console.log('jwt configured', isConnectorJwtConfigured())
  const url = resolveSupabaseUrl()
  const s = createClient(url!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const id = 'a64a0644-ec30-4a22-a332-10cd9223a559'
  const { data: ident, error: ie } = await s
    .from('access_identities')
    .select('*')
    .eq('id', id)
    .single()
  console.log('identity', ie?.message || ident?.handle)

  const code = randomBytes(3).toString('hex').toUpperCase()
  const exp = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  const ins = await s.from('connector_pairing_codes').insert({
    code,
    identity_id: id,
    clerk_user_id: ident!.clerk_user_id,
    created_by_clerk: ident!.clerk_user_id,
    expires_at: exp,
  })
  console.log('insert', ins.error?.message || 'ok')

  const head = await s
    .from('connector_pairing_codes')
    .select('code', { head: true, count: 'exact' })
  console.log('head', head.error?.message || head.count)

  const sel = await s.from('connector_pairing_codes').select('*').eq('code', code).maybeSingle()
  console.log('select', sel.error?.message || sel.data?.code)

  const res = await fetch('http://localhost:3000/api/connector/v1/devices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pairingCode: code, deviceName: 'M4 Test' }),
  })
  console.log('register', res.status, await res.text())
}

main()
