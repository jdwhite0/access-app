import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import BillingPageClient from '@/components/settings/BillingPageClient'

export const metadata = { title: 'Billing — ACCESS' }

export default async function BillingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=settings/billing')
  return <BillingPageClient />
}
