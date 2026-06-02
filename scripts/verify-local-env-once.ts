/**
 * One-off local env verification (no secrets printed).
 * Run: npx tsx scripts/verify-local-env-once.ts
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
    // Vercel CLI wraps values in double quotes; strip outer quotes and unescape \" 
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
  if (!process.env.CLERK_SECRET_KEY) {
    try {
      loadEnvLocal()
    } catch {
      console.log(JSON.stringify({ env_file: 'missing', clerk_env: false, supabase_env: false }))
      return
    }
  }
  const { isSupabaseConfigured, createSupabaseAdmin } = await import('../lib/supabase')

  const clerkOk = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  )
  const supabaseOk = isSupabaseConfigured()

  console.log(JSON.stringify({ clerk_env: clerkOk, supabase_env: supabaseOk }, null, 2))

  if (supabaseOk) {
    const client = createSupabaseAdmin()
    if (client) {
      const { error } = await client.from('access_identities').select('id').limit(1)
      console.log(
        JSON.stringify({
          supabase_query: error ? { ok: false, message: error.message } : { ok: true },
        })
      )
    }
  }
}

main().catch((e) => {
  console.error(String(e))
  process.exit(1)
})
