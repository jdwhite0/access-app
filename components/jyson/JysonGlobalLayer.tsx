'use client'

import { useAuth } from '@clerk/nextjs'
import type { ReactNode } from 'react'
import { JysonLayerProvider } from './JysonLayerProvider'
import JysonPersistentLayer from './JysonPersistentLayer'

type Props = { children: ReactNode }

/** Persistent JYSON operating layer on every signed-in route */
export default function JysonGlobalLayer({ children }: Props) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded || !isSignedIn) {
    return <>{children}</>
  }

  return (
    <JysonLayerProvider>
      {children}
      <JysonPersistentLayer />
    </JysonLayerProvider>
  )
}
