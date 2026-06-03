import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createSupabaseAdmin } from '@/lib/supabase'
import { getAllUsers } from '@/lib/admin/get-all-users'
import AdminPageClient from '@/components/admin/AdminPageClient'

export const metadata = { title: 'Admin — ACCESS' }

const FOUNDER_CLERK_USERNAMES = ['jdwhite']

export default async function AdminPage() {
  const { userId, sessionClaims } = await auth()
  if (!userId) redirect('/')

  // Double-check from DB — only founder plan can access admin
  const supabase = createSupabaseAdmin()
  if (supabase) {
    const { data } = await supabase
      .from('access_identities')
      .select('plan, handle')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    const handle = (data?.handle as string | null) ?? ''
    const username = handle.replace('.access', '')
    const plan = (data?.plan as string) ?? 'free'

    const isFounder = plan === 'founder' || FOUNDER_CLERK_USERNAMES.includes(username.toLowerCase())
    if (!isFounder) redirect('/dashboard')
  }

  const result = await getAllUsers()

  if ('error' in result) {
    return (
      <div style={{ padding: 40, color: 'var(--error)', fontFamily: 'var(--mono)', fontSize: '0.82rem' }}>
        Failed to load admin data: {result.error}
      </div>
    )
  }

  return <AdminPageClient users={result.users} stats={result.stats} />
}
