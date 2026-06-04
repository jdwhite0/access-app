import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AgentsPageClient from '@/components/platform/AgentsPageClient'

export const metadata = {
  title: 'Team — ACCESS',
  description: 'AI agents and collaborators — who and what is doing work for you.',
}

export default async function AgentsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=agents')
  return (
    <Suspense fallback={<div className="access-platform-loading">Loading agents…</div>}>
      <AgentsPageClient />
    </Suspense>
  )
}
