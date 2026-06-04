import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import CustomersPageClient from '@/components/platform/CustomersPageClient'

export const metadata = {
  title: 'Customers — ACCESS',
  description: 'Clients, leads, subscribers, and relationships connected to your revenue and pipeline.',
}

export default async function CustomersPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  return <CustomersPageClient />
}
