import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

/** Resolve a valid Supabase HTTP origin; return null if env is missing or malformed. */
export function resolveSupabaseUrl(): string | null {
  let raw = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  if (!raw) return null

  if (!/^https?:\/\//i.test(raw)) {
    raw = raw.includes('.') ? `https://${raw}` : `https://${raw}.supabase.co`
  }

  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.origin
  } catch {
    return null
  }
}

export function createSupabaseAdmin(): SupabaseClient | null {
  const url = resolveSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !key) return null

  if (!_client) {
    _client = createClient(url, key, {
      auth: { persistSession: false },
    })
  }
  return _client
}

export function isSupabaseConfigured(): boolean {
  const url = resolveSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  return !!(url && key)
}
