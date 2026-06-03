import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getFounderBlueprint } from '@/lib/actions/founder-blueprint'
import FounderBlueprintWizard from '@/components/founder/FounderBlueprintWizard'

export const metadata = {
  title: 'Founder — ACCESS',
  description: 'Your Founder OS blueprint and system overview.',
}

export default async function FounderPage() {
  const { userId } = await auth()
  if (!userId) redirect('/')

  // If blueprint is materialized/exported → user has completed setup → show overview
  const blueprint = await getFounderBlueprint()
  const status = blueprint?.spec?.status
  if (status === 'materialized' || status === 'exported') {
    redirect('/founder/overview')
  }

  // No blueprint or draft → show wizard
  return (
    <Suspense fallback={null}>
      <FounderBlueprintWizard />
    </Suspense>
  )
}
