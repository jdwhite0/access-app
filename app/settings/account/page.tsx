import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AccountPageClient from '@/components/settings/AccountPageClient'

export const metadata = { title: 'Account — ACCESS' }

export default async function AccountPage() {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=settings/account')
  return <AccountPageClient />
}
