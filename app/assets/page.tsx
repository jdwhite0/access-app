import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import RegistryModuleClient from '@/components/platform/RegistryModuleClient'

export default async function Page() {
  const { userId } = await auth()
  if (!userId) redirect('/')
  return <RegistryModuleClient module="assets" />
}
