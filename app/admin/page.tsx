import { getAllUsers } from '@/lib/admin/get-all-users'
import AdminPageClient from '@/components/admin/AdminPageClient'

export const metadata = { title: 'Admin Overview — ACCESS' }
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const result = await getAllUsers()

  if ('error' in result) {
    return (
      <div style={{ color: 'var(--error)', fontFamily: 'var(--mono)', fontSize: 13 }}>
        Failed to load admin data: {result.error}
      </div>
    )
  }

  return <AdminPageClient users={result.users} stats={result.stats} />
}
