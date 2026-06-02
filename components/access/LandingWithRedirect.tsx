'use client'

import { useSearchParams } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import TerminalLanding from '@/components/TerminalLanding'

const REDIRECT_ROUTES: Record<string, string> = {
  founder: '/founder',
  companion: '/companion',
}

/**
 * Wraps landing auth so sign-in returns to the route the user originally wanted.
 */
export default function LandingWithRedirect() {
  const searchParams = useSearchParams()
  const { redirectToSignIn } = useClerk()

  const handleSignIn = () => {
    const key = searchParams.get('redirect')
    const path = key ? REDIRECT_ROUTES[key] : null
    const redirectUrl =
      typeof window !== 'undefined'
        ? path
          ? `${window.location.origin}${path}`
          : window.location.href
        : '/'
    redirectToSignIn({ redirectUrl })
  }

  return <TerminalLanding onSignIn={handleSignIn} />
}
