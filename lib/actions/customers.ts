'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { Customer, CustomerType } from '@/types/db'

function missing(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false
  return err.code === '42P01' || err.code === 'PGRST205' || !!err.message?.includes('customers')
}

function ownerHandle(userId: string): string {
  return userId.slice(0, 12)
}

export async function listCustomers(): Promise<Customer[]> {
  const { userId } = await auth()
  if (!userId) return []
  const supabase = createSupabaseAdmin()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('clerk_user_id', userId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
  if (missing(error)) return []
  return (data ?? []) as Customer[]
}

export async function addCustomer(input: {
  name: string
  email?: string
  type: CustomerType
  notes?: string
}): Promise<{ customer: Customer | null; error: string | null }> {
  const { userId } = await auth()
  if (!userId) return { customer: null, error: 'Not authenticated' }
  if (!input.name.trim()) return { customer: null, error: 'Name is required' }

  const supabase = createSupabaseAdmin()
  if (!supabase) return { customer: null, error: 'Database unavailable — run schema migration first.' }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      clerk_user_id: userId,
      owner_handle: ownerHandle(userId),
      name: input.name.trim(),
      email: input.email?.trim() || null,
      type: input.type,
      notes: input.notes?.trim() || null,
      status: 'active',
    })
    .select('*')
    .single()

  if (missing(error)) {
    return { customer: null, error: 'Customers table not found. Run supabase/schema_v6_customers.sql to create it.' }
  }
  if (error) return { customer: null, error: error.message }
  return { customer: data as Customer, error: null }
}

export async function archiveCustomer(id: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false
  const supabase = createSupabaseAdmin()
  if (!supabase) return false
  const { error } = await supabase
    .from('customers')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('clerk_user_id', userId)
  return !error
}
