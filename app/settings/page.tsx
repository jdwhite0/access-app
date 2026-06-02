import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import SettingsPageClient from '@/components/settings/SettingsPageClient'

export const metadata = {
  title: 'Settings — ACCESS',
  description: 'ACCESS OS settings and operator tools.',
}

export default async function SettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=settings')

  return <SettingsPageClient />
}
