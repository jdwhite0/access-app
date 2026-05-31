'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { AccessIdentity } from '@/types/db'

export async function getOrCreateIdentity(handle: string): Promise<AccessIdentity | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createSupabaseAdmin()
  if (!supabase) {
    // DB not configured — return ephemeral identity
    return {
      id: 'local',
      clerk_user_id: userId,
      handle,
      status: 'active',
      created_at: new Date().toISOString(),
    }
  }

  // Try to find existing identity
  const { data: existing } = await supabase
    .from('access_identities')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  if (existing) return existing as AccessIdentity

  // Create profile + identity (first login)
  await supabase
    .from('profiles')
    .upsert({ clerk_user_id: userId, access_handle: handle }, { onConflict: 'clerk_user_id' })

  const { data, error } = await supabase
    .from('access_identities')
    .insert({ clerk_user_id: userId, handle, status: 'active' })
    .select('*')
    .single()

  if (error) {
    // Handle unique constraint — identity may have been created concurrently
    const { data: fallback } = await supabase
      .from('access_identities')
      .select('*')
      .eq('clerk_user_id', userId)
      .single()
    return (fallback ?? null) as AccessIdentity | null
  }

  return data as AccessIdentity
}

export async function getIdentity(): Promise<AccessIdentity | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createSupabaseAdmin()
  if (!supabase) return null

  const { data } = await supabase
    .from('access_identities')
    .select('*')
    .eq('clerk_user_id', userId)
    .single()

  return (data ?? null) as AccessIdentity | null
}
