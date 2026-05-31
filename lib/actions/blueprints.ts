'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { Blueprint, SystemType } from '@/types/db'

export async function saveBlueprint(
  type: SystemType,
  answers: string[],
  ownerHandle: string,
  systemId?: string
): Promise<Blueprint | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return {
      id: `local-${Date.now()}`,
      clerk_user_id: userId,
      owner_handle: ownerHandle,
      type,
      answers,
      system_id: systemId ?? null,
      created_at: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('blueprints')
    .insert({
      clerk_user_id: userId,
      owner_handle: ownerHandle,
      type,
      answers,
      system_id: systemId ?? null,
    })
    .select('*')
    .single()

  if (error) return null
  return data as Blueprint
}

export async function listBlueprints(): Promise<Blueprint[]> {
  const { userId } = await auth()
  if (!userId) return []

  const supabase = createSupabaseAdmin()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('blueprints')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return []
  return (data ?? []) as Blueprint[]
}

export async function deleteBlueprint(id: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const supabase = createSupabaseAdmin()
  if (!supabase) return false

  const { error } = await supabase
    .from('blueprints')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('id', id)

  return !error
}

export async function linkBlueprintToSystem(blueprintId: string, systemId: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const supabase = createSupabaseAdmin()
  if (!supabase) return false

  const { error } = await supabase
    .from('blueprints')
    .update({ system_id: systemId })
    .eq('clerk_user_id', userId)
    .eq('id', blueprintId)

  return !error
}
