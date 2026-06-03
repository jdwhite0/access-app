import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AgentsPageClient from '@/components/platform/AgentsPageClient'

export const metadata = {
  title: 'Agents — ACCESS',
  description: 'Your AI team — JYSON, OpenJarvis, and registered agents.',
}

export default async function AgentsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=agents')
  return <AgentsPageClient />
}
