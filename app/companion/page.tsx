import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import CompanionHashScroll from '@/components/navigation/CompanionHashScroll'
import JysonCompanionPanel from '@/components/jyson/JysonCompanionPanel'
import { PRIMARY_TEST_HANDLE } from '@/lib/access-handle/constants'
import { loadJysonContextFromAccessHandle } from '@/lib/jyson-bridge/load-jyson-context'
import type { JysonContext } from '@/lib/jyson-bridge/types'

export const metadata = {
  title: 'JYSON — ACCESS',
  description: 'Talk to your world. JYSON is the intelligence layer of ACCESS.',
}

type CompanionPageProps = {
  searchParams: Promise<{ preview?: string }>
}

export default async function CompanionPage({ searchParams }: CompanionPageProps) {
  const sp = await searchParams
  const isDevFixture =
    process.env.NODE_ENV === 'development' && sp.preview === 'fixture'

  if (!isDevFixture) {
    const { userId } = await auth()
    if (!userId) redirect('/?redirect=companion')
  }

  let devFixtureContext: JysonContext | null = null
  if (isDevFixture) {
    const loaded = await loadJysonContextFromAccessHandle(PRIMARY_TEST_HANDLE)
    devFixtureContext = loaded.context
  }

  return (
    <div className="companion-route-root relative h-full min-h-0">
      <CompanionHashScroll />
      <Suspense fallback={null}>
        <JysonCompanionPanel devFixtureContext={devFixtureContext} />
      </Suspense>
    </div>
  )
}
