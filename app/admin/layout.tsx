import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createSupabaseAdmin } from '@/lib/supabase'
import AdminNav from '@/components/admin/AdminNav'

const FOUNDER_CLERK_USERNAMES = ['jdwhite']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/')

  const supabase = createSupabaseAdmin()
  if (supabase) {
    const { data } = await supabase
      .from('access_identities')
      .select('plan, handle')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    const handle = (data?.handle as string | null) ?? ''
    const username = handle.replace('.access', '').toLowerCase()
    const plan = (data?.plan as string) ?? 'free'
    const isFounder = plan === 'founder' || FOUNDER_CLERK_USERNAMES.includes(username)
    if (!isFounder) redirect('/dashboard')
  }

  return (
    <div style={{
      display: 'flex',
      height: '100dvh',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      <AdminNav />
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '32px 36px',
        minWidth: 0,
      }}>
        {children}
      </main>
    </div>
  )
}
