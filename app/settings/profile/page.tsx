import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ProfilePageClient from '@/components/settings/ProfilePageClient'

export const metadata = { title: 'Profile — ACCESS' }

export default async function ProfilePage() {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=settings/profile')
  return <ProfilePageClient />
}
