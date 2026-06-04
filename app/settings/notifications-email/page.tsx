import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import NotificationsEmailPageClient from '@/components/settings/NotificationsEmailPageClient'

export const metadata = {
  title: 'Notifications & Email — ACCESS',
  description: 'Manage required account emails and ACCESS Intelligence marketing preferences.',
}

export default async function NotificationsEmailPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=%2Fsettings%2Fnotifications-email')
  return <NotificationsEmailPageClient />
}
