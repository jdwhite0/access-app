'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Shared CTA routing: signed-in → dashboard, else /sign-in.
 */
export function useMarketingAuthActions() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  const startBuilding = useCallback(() => {
    if (isSignedIn) {
      router.push('/dashboard')
      return
    }
    router.push('/sign-up')
  }, [isSignedIn, router])

  const dashboardHref = isLoaded && isSignedIn ? '/dashboard' : '/sign-in'

  const handleDashboardClick = useCallback(
    (e: React.MouseEvent) => {
      if (isLoaded && isSignedIn) return
      e.preventDefault()
      router.push('/sign-in')
    },
    [isLoaded, isSignedIn, router]
  )

  return {
    isSignedIn: Boolean(isLoaded && isSignedIn),
    isLoaded,
    startBuilding,
    dashboardHref,
    handleDashboardClick,
  }
}
