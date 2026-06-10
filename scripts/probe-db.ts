import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createSupabaseAdmin } from '../lib/supabase'

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()
    const commentIdx = v.lastIndexOf('#')
    if (commentIdx >= 0) v = v.slice(0, commentIdx).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[k]) process.env[k] = v
  }
}

async function main() {
  loadEnv()
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    console.error('Supabase not configured')
    process.exit(1)
  }

  const { data, error } = await supabase.from('pipeline_leads').select('*').limit(1)
  if (error) {
    console.error('Error querying pipeline_leads:', error)
  } else {
    console.log('Columns in pipeline_leads:', data.length > 0 ? Object.keys(data[0]) : 'No rows returned')
  }
}

main().catch(console.error)
