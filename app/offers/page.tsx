import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import OffersPageClient from '@/components/platform/OffersPageClient'

export const metadata = { title: 'Offers — ACCESS' }

export default async function OffersPage() {
  const { userId } = await auth()
  if (!userId) redirect('/')
  return <OffersPageClient />
}
