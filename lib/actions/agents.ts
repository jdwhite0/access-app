'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { Agent } from '@/types/db'

export async function createAgent(
  ownerHandle: string,
  name: string,
  description: string,
  role?: string,
  systemId?: string
): Promise<Agent | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return {
      id: `local-${Date.now()}`, clerk_user_id: userId, owner_handle: ownerHandle,
      name, description: description || null, role: role || null,
      system_id: systemId || null, status: 'active',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('agents')
    .insert({ clerk_user_id: userId, owner_handle: ownerHandle, name, description: description || null, role: role || null, system_id: systemId || null })
    .select('*').single()

  if (error) return null
  return data as Agent
}

export async function listAgents(): Promise<Agent[]> {
  const { userId } = await auth()
  if (!userId) return []
  const supabase = createSupabaseAdmin()
  if (!supabase) return []
  const { data } = await supabase.from('agents').select('*').eq('clerk_user_id', userId).eq('status', 'active').order('created_at', { ascending: false })
  return (data ?? []) as Agent[]
}

export async function deleteAgent(id: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const supabase = createSupabaseAdmin()
  if (!supabase) return false
  const { error } = await supabase.from('agents').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('clerk_user_id', userId).eq('id', id)
  return !error
}
