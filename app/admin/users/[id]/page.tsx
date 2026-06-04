import { notFound } from 'next/navigation'
import { createSupabaseAdmin } from '@/lib/supabase'
import UserDetailClient from '@/components/admin/UserDetailClient'

export const dynamic = 'force-dynamic'

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createSupabaseAdmin()
  if (!supabase) return notFound()

  const { data: identity } = await supabase
    .from('access_identities')
    .select('id, clerk_user_id, handle, plan, stripe_customer_id, created_at')
    .eq('id', id)
    .maybeSingle()

  if (!identity) return notFound()

  // Pull usage
  const { data: usage } = await supabase
    .from('usage_events')
    .select('event_type, created_at')
    .eq('identity_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const jysonTotal = (usage ?? []).filter((u) => u.event_type === 'jyson_message').length
  const jysonMo = (usage ?? []).filter((u) => u.event_type === 'jyson_message' && new Date(u.created_at) >= startOfMonth).length
  const registryTotal = (usage ?? []).filter((u) => u.event_type === 'registry_write').length
  const recentEvents = (usage ?? []).slice(0, 10)

  return (
    <UserDetailClient
      identity={{
        id: identity.id as string,
        clerk_user_id: identity.clerk_user_id as string,
        handle: (identity.handle as string | null) ?? null,
        plan: (identity.plan as string) ?? 'free',
        stripe_customer_id: (identity.stripe_customer_id as string | null) ?? null,
        created_at: (identity.created_at as string | null) ?? null,
      }}
      usage={{ jysonTotal, jysonMo, registryTotal }}
      recentEvents={recentEvents.map((e) => ({ type: e.event_type as string, ts: e.created_at as string }))}
    />
  )
}
