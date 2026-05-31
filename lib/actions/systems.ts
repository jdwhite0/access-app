'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { System, SystemType } from '@/types/db'

export interface CreateSystemInput {
  name: string
  systemHandle: string   // e.g., "jdproductions.access"
  ownerHandle: string    // e.g., "jdwhite.access"
  type: SystemType
  description?: string
  blueprintId?: string
}

export async function createSystem(input: CreateSystemInput): Promise<System | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createSupabaseAdmin()
  if (!supabase) {
    // Offline/local fallback
    return {
      id: `local-${Date.now()}`,
      clerk_user_id: userId,
      owner_handle: input.ownerHandle,
      system_handle: input.systemHandle,
      name: input.name,
      type: input.type,
      description: input.description ?? null,
      status: 'active',
      blueprint_id: input.blueprintId ?? null,
      created_at: new Date().toISOString(),
    }
  }

  // Check for handle uniqueness
  const { data: existing } = await supabase
    .from('systems')
    .select('id, system_handle')
    .eq('system_handle', input.systemHandle)
    .single()

  if (existing) {
    // Handle taken — append timestamp suffix
    input.systemHandle = input.systemHandle.replace('.access', '') + `-${Date.now().toString(36)}.access`
  }

  const { data, error } = await supabase
    .from('systems')
    .insert({
      clerk_user_id: userId,
      owner_handle: input.ownerHandle,
      system_handle: input.systemHandle,
      name: input.name,
      type: input.type,
      description: input.description ?? null,
      status: 'active',
      blueprint_id: input.blueprintId ?? null,
    })
    .select('*')
    .single()

  if (error) return null
  return data as System
}

export async function listSystems(ownerHandle?: string): Promise<System[]> {
  const { userId } = await auth()
  if (!userId) return []

  const supabase = createSupabaseAdmin()
  if (!supabase) return []

  const query = supabase
    .from('systems')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as System[]
}

export async function getSystem(systemHandle: string): Promise<System | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createSupabaseAdmin()
  if (!supabase) return null

  const { data } = await supabase
    .from('systems')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('system_handle', systemHandle)
    .single()

  return (data ?? null) as System | null
}

export async function deleteSystem(systemHandle: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const supabase = createSupabaseAdmin()
  if (!supabase) return false

  const { error } = await supabase
    .from('systems')
    .update({ status: 'archived' })
    .eq('clerk_user_id', userId)
    .eq('system_handle', systemHandle)

  return !error
}
