'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { Asset, AssetType } from '@/types/db'

export async function createAsset(
  ownerHandle: string,
  name: string,
  description: string,
  assetType: AssetType = 'other',
  url?: string
): Promise<Asset | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return {
      id: `local-${Date.now()}`, clerk_user_id: userId, owner_handle: ownerHandle,
      name, description: description || null, asset_type: assetType,
      url: url || null, status: 'active',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('assets')
    .insert({ clerk_user_id: userId, owner_handle: ownerHandle, name, description: description || null, asset_type: assetType, url: url || null })
    .select('*').single()

  if (error) return null
  return data as Asset
}

export async function listAssets(): Promise<Asset[]> {
  const { userId } = await auth()
  if (!userId) return []
  const supabase = createSupabaseAdmin()
  if (!supabase) return []
  const { data } = await supabase.from('assets').select('*').eq('clerk_user_id', userId).eq('status', 'active').order('created_at', { ascending: false })
  return (data ?? []) as Asset[]
}

export async function deleteAsset(id: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const supabase = createSupabaseAdmin()
  if (!supabase) return false
  const { error } = await supabase.from('assets').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('clerk_user_id', userId).eq('id', id)
  return !error
}
