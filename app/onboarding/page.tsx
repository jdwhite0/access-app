import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'

export const metadata = {
  title: 'Welcome to ACCESS — Account Setup',
  description: 'Claim your ACCESS identity and set up your account.',
}

export default async function OnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/')

  return (
    <Suspense fallback={null}>
      <OnboardingFlow />
    </Suspense>
  )
}
