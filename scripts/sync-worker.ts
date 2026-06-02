/**
 * Drain pending sync_jobs (Phase 4D).
 * Run: npx tsx scripts/sync-worker.ts [--once]
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { processNextSyncJob } from '../lib/sync/queue'
import { classifyError } from '../lib/platform-health'

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
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    const classified = classifyError({
      message: 'Missing Supabase env in .env.local',
      product: 'access_os',
      service: 'database',
    })
    console.error(classified.event.messages.internal_engineering)
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const once = process.argv.includes('--once')

  do {
    const result = await processNextSyncJob(supabase)
    if (!result.processed) {
      console.log('No pending jobs.')
      break
    }
    console.log(JSON.stringify(result, null, 2))
  } while (!once)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
