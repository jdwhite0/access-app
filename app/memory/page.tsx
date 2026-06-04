import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import MemoryPageClient from '@/components/platform/MemoryPageClient'

export const metadata = {
  title: 'Knowledge — ACCESS',
  description: 'What ACCESS remembers — your identity, business context, and saved intelligence.',
}

export default async function MemoryPage() {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=memory')
  return <MemoryPageClient />
}
