'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { AccessIdentity } from '@/types/db'

export type IdentityResult = {
  identity: AccessIdentity | null
  error?: string
}

export async function getOrCreateIdentity(handle: string): Promise<IdentityResult> {
  const { userId } = await auth()
  if (!userId) {
    return { identity: null, error: 'Not signed in.' }
  }

  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return {
      identity: {
        id: 'local',
        clerk_user_id: userId,
        handle,
        status: 'active',
        created_at: new Date().toISOString(),
      },
    }
  }

  const { data: existing } = await supabase
    .from('access_identities')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (existing) {
    return { identity: existing as AccessIdentity }
  }

  const { data: handleTaken } = await supabase
    .from('access_identities')
    .select('clerk_user_id, handle')
    .eq('handle', handle)
    .maybeSingle()

  if (handleTaken && handleTaken.clerk_user_id !== userId) {
    return {
      identity: null,
      error: `Handle "${handle}" is already claimed by another ACCESS account. Choose a different username in Clerk or contact support.`,
    }
  }

  await supabase
    .from('profiles')
    .upsert({ clerk_user_id: userId, access_handle: handle }, { onConflict: 'clerk_user_id' })

  const { data, error } = await supabase
    .from('access_identities')
    .insert({ clerk_user_id: userId, handle, status: 'active' })
    .select('*')
    .single()

  if (error) {
    const { data: fallback } = await supabase
      .from('access_identities')
      .select('*')
      .eq('clerk_user_id', userId)
      .maybeSingle()
    if (fallback) return { identity: fallback as AccessIdentity }
    return { identity: null, error: error.message }
  }

  return { identity: data as AccessIdentity }
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
    .maybeSingle()

  return (data ?? null) as AccessIdentity | null
}
