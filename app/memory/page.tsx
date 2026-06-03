import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import MemoryPageClient from '@/components/platform/MemoryPageClient'

export const metadata = {
  title: 'Memory — ACCESS',
  description: 'What JYSON knows about you — your identity, world, and context.',
}

export default async function MemoryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=memory')
  return <MemoryPageClient />
}
