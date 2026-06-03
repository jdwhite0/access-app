import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ProjectsPageClient from '@/components/platform/ProjectsPageClient'

export const metadata = {
  title: 'Projects — ACCESS',
  description: 'Active ventures, builds, and initiatives inside ACCESS.',
}

export default async function ProjectsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=projects')
  return <ProjectsPageClient />
}
