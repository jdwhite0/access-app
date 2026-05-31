'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { Offer } from '@/types/db'

export async function createOffer(ownerHandle: string, name: string, description: string, delivery?: string, pricing?: string): Promise<Offer | null> {
  const { userId } = await auth()
  if (!userId) return null
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return {
      id: `local-${Date.now()}`, clerk_user_id: userId, owner_handle: ownerHandle,
      name, description: description || null, delivery: delivery || null,
      pricing: pricing || null, status: 'draft', system_id: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
  }
  const { data, error } = await supabase
    .from('offers')
    .insert({ clerk_user_id: userId, owner_handle: ownerHandle, name, description: description || null, delivery: delivery || null, pricing: pricing || null })
    .select('*').single()
  if (error) return null
  return data as Offer
}

export async function listOffers(): Promise<Offer[]> {
  const { userId } = await auth()
  if (!userId) return []
  const supabase = createSupabaseAdmin()
  if (!supabase) return []
  const { data } = await supabase.from('offers').select('*').eq('clerk_user_id', userId).neq('status', 'archived').order('created_at', { ascending: false })
  return (data ?? []) as Offer[]
}

export async function deleteOffer(id: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const supabase = createSupabaseAdmin()
  if (!supabase) return false
  const { error } = await supabase.from('offers').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('clerk_user_id', userId).eq('id', id)
  return !error
}
