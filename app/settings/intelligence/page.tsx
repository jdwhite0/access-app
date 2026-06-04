import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import IntelligenceSettingsClient from '@/components/settings/IntelligenceSettingsClient'

export const metadata = {
  title: 'Intelligence settings — ACCESS',
  description: 'Personalize your JYSON AI operator — name, role, and purpose.',
}

export default async function IntelligenceSettingsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=settings/intelligence')
  return <IntelligenceSettingsClient />
}
