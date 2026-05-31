'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { Workflow } from '@/types/db'

export async function createWorkflow(ownerHandle: string, name: string, description: string, trigger?: string): Promise<Workflow | null> {
  const { userId } = await auth()
  if (!userId) return null
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return {
      id: `local-${Date.now()}`, clerk_user_id: userId, owner_handle: ownerHandle,
      name, description: description || null, trigger: trigger || null,
      system_id: null, status: 'active',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
  }
  const { data, error } = await supabase
    .from('workflows')
    .insert({ clerk_user_id: userId, owner_handle: ownerHandle, name, description: description || null, trigger: trigger || null })
    .select('*').single()
  if (error) return null
  return data as Workflow
}

export async function listWorkflows(): Promise<Workflow[]> {
  const { userId } = await auth()
  if (!userId) return []
  const supabase = createSupabaseAdmin()
  if (!supabase) return []
  const { data } = await supabase.from('workflows').select('*').eq('clerk_user_id', userId).eq('status', 'active').order('created_at', { ascending: false })
  return (data ?? []) as Workflow[]
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const supabase = createSupabaseAdmin()
  if (!supabase) return false
  const { error } = await supabase.from('workflows').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('clerk_user_id', userId).eq('id', id)
  return !error
}
