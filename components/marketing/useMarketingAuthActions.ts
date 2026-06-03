'use client'

import { useAuth, useClerk } from '@clerk/nextjs'
import { useCallback } from 'react'

/**
 * Shared CTA routing: signed-in → dashboard, else Clerk sign-in.
 */
export function useMarketingAuthActions() {
  const { isSignedIn, isLoaded } = useAuth()
  const { redirectToSignIn } = useClerk()

  const startBuilding = useCallback(() => {
    if (isSignedIn) {
      window.location.href = '/dashboard'
      return
    }
    redirectToSignIn({ redirectUrl: `${window.location.origin}/dashboard` })
  }, [isSignedIn, redirectToSignIn])

  const dashboardHref = isLoaded && isSignedIn ? '/dashboard' : undefined

  const handleDashboardClick = useCallback(
    (e: React.MouseEvent) => {
      if (dashboardHref) return
      e.preventDefault()
      redirectToSignIn({ redirectUrl: `${window.location.origin}/dashboard` })
    },
    [dashboardHref, redirectToSignIn]
  )

  return {
    isSignedIn: Boolean(isLoaded && isSignedIn),
    isLoaded,
    startBuilding,
    dashboardHref: dashboardHref ?? '#',
    handleDashboardClick,
  }
}
