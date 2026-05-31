'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { Vault, VaultType } from '@/types/db'

export async function createVault(ownerHandle: string, name: string, description: string, vaultType?: VaultType): Promise<Vault | null> {
  const { userId } = await auth()
  if (!userId) return null
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return {
      id: `local-${Date.now()}`, clerk_user_id: userId, owner_handle: ownerHandle,
      name, description: description || null, vault_type: vaultType || null,
      status: 'active',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
  }
  const { data, error } = await supabase
    .from('vaults')
    .insert({ clerk_user_id: userId, owner_handle: ownerHandle, name, description: description || null, vault_type: vaultType || null })
    .select('*').single()
  if (error) return null
  return data as Vault
}

export async function listVaults(): Promise<Vault[]> {
  const { userId } = await auth()
  if (!userId) return []
  const supabase = createSupabaseAdmin()
  if (!supabase) return []
  const { data } = await supabase.from('vaults').select('*').eq('clerk_user_id', userId).eq('status', 'active').order('created_at', { ascending: false })
  return (data ?? []) as Vault[]
}

export async function deleteVault(id: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const supabase = createSupabaseAdmin()
  if (!supabase) return false
  const { error } = await supabase.from('vaults').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('clerk_user_id', userId).eq('id', id)
  return !error
}
