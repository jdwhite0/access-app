import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import VaultsPageClient from '@/components/platform/VaultsPageClient'

export const metadata = {
  title: 'Vaults — ACCESS',
  description: 'Knowledge stores connected to JYSON. Register your Obsidian vault or local folders.',
}

export default async function VaultsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  return <VaultsPageClient />
}
