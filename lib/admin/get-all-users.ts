'use server'

import { createSupabaseAdmin } from '@/lib/supabase'

export type AdminUserRow = {
  id: string
  clerk_user_id: string
  handle: string | null
  plan: string
  stripe_customer_id: string | null
  created_at: string | null
  jyson_messages_mo: number
  registry_objects_total: number
}

export type AdminStats = {
  total: number
  paid: number
  free: number
  founder: number
  mrr_estimate: number
}

const PLAN_MRR: Record<string, number> = {
  builder: 599,
  operator: 299,
  founder: 0,
  free: 0,
}

export async function getAllUsers(): Promise<
  { users: AdminUserRow[]; stats: AdminStats } | { error: string }
> {
  const supabase = createSupabaseAdmin()
  if (!supabase) return { error: 'Database not available.' }

  const { data: identities, error: idErr } = await supabase
    .from('access_identities')
    .select('id, clerk_user_id, handle, plan, stripe_customer_id, created_at')
    .order('created_at', { ascending: false })

  if (idErr || !identities) return { error: idErr?.message ?? 'Failed to load users.' }

  // Pull usage counts for all identities in a single query
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: usageRaw } = await supabase
    .from('usage_events')
    .select('identity_id, event_type')

  const usageByIdentity: Record<string, { jyson_mo: number; registry_total: number }> = {}
  for (const row of usageRaw ?? []) {
    const id = row.identity_id as string
    if (!usageByIdentity[id]) usageByIdentity[id] = { jyson_mo: 0, registry_total: 0 }
    if (row.event_type === 'jyson_message') {
      usageByIdentity[id].jyson_mo++
    }
    if (row.event_type === 'registry_write') {
      usageByIdentity[id].registry_total++
    }
  }

  const users: AdminUserRow[] = identities.map((i) => ({
    id: i.id as string,
    clerk_user_id: i.clerk_user_id as string,
    handle: (i.handle as string | null) ?? null,
    plan: (i.plan as string) ?? 'free',
    stripe_customer_id: (i.stripe_customer_id as string | null) ?? null,
    created_at: (i.created_at as string | null) ?? null,
    jyson_messages_mo: usageByIdentity[i.id as string]?.jyson_mo ?? 0,
    registry_objects_total: usageByIdentity[i.id as string]?.registry_total ?? 0,
  }))

  const stats: AdminStats = {
    total: users.length,
    paid: users.filter((u) => u.plan === 'builder' || u.plan === 'operator').length,
    free: users.filter((u) => u.plan === 'free').length,
    founder: users.filter((u) => u.plan === 'founder').length,
    mrr_estimate: users.reduce((sum, u) => sum + (PLAN_MRR[u.plan] ?? 0), 0),
  }

  return { users, stats }
}
