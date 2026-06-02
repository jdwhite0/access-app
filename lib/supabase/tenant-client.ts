import { SignJWT } from 'jose'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { resolveSupabaseUrl } from '@/lib/supabase'

const TENANT_ROLE = 'authenticated'
const TENANT_AUD = 'authenticated'

function getJwtSecret(): Uint8Array | null {
  const raw =
    process.env.SUPABASE_JWT_SECRET?.trim() ??
    process.env.JWT_SECRET?.trim()
  if (!raw || raw.length < 32) return null
  return new TextEncoder().encode(raw)
}

export function isTenantSupabaseConfigured(): boolean {
  const url = resolveSupabaseUrl()
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  return !!(url && anon && getJwtSecret())
}

/** Short-lived Supabase JWT so RLS applies (service_role bypasses RLS). */
export async function signTenantAccessToken(input: {
  identityId: string
  clerkUserId: string
  ttlMinutes?: number
}): Promise<string | null> {
  const secret = getJwtSecret()
  if (!secret) return null

  const ttl = input.ttlMinutes ?? 15
  const exp = Math.floor(Date.now() / 1000) + ttl * 60

  return new SignJWT({
    identity_id: input.identityId,
    role: TENANT_ROLE,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(input.clerkUserId)
    .setAudience(TENANT_AUD)
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret)
}

/** Supabase client subject to RLS for connector sync apply. */
export async function createTenantSupabase(input: {
  identityId: string
  clerkUserId: string
}): Promise<SupabaseClient | null> {
  const url = resolveSupabaseUrl()
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !anon) return null

  const accessToken = await signTenantAccessToken(input)
  if (!accessToken) return null

  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  })
}
