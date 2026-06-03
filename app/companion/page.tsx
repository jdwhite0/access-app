import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import CompanionHashScroll from '@/components/navigation/CompanionHashScroll'
import JysonCompanionPanel from '@/components/jyson/JysonCompanionPanel'
import { PRIMARY_TEST_HANDLE } from '@/lib/access-handle/constants'
import { loadJysonContextFromAccessHandle } from '@/lib/jyson-bridge/load-jyson-context'
import type { JysonContext } from '@/lib/jyson-bridge/types'

export const metadata = {
  title: 'JYSON Companion — ACCESS',
  description: 'Your intelligence companion inside ACCESS. Read-only world awareness.',
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
    <div className="companion-route-root relative h-full min-h-0 scanline">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(64,192,208,1) 1px, transparent 1px), linear-gradient(90deg, rgba(64,192,208,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <CompanionHashScroll />
      <Suspense fallback={null}>
        <JysonCompanionPanel devFixtureContext={devFixtureContext} />
      </Suspense>
    </div>
  )
}
