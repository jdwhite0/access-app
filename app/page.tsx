'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import TerminalLanding from '@/components/TerminalLanding'
import AccessOsShell from '@/components/os/AccessOsShell'
import { getOnboardingState } from '@/lib/actions/onboarding'

const AUTH_LOAD_TIMEOUT_MS = 12_000

export default function Page() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const [authTimedOut, setAuthTimedOut] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  useEffect(() => {
    if (isLoaded) {
      setAuthTimedOut(false)
      return
    }
    const t = window.setTimeout(() => setAuthTimedOut(true), AUTH_LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(t)
  }, [isLoaded])

  // Gate: after auth loads and user is signed in, check onboarding state
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      if (isLoaded) setOnboardingChecked(true) // unauthenticated — no check needed
      return
    }
    getOnboardingState().then((state) => {
      if (state.redirectTo && state.redirectTo !== '/') {
        router.replace(state.redirectTo)
      } else {
        setOnboardingChecked(true)
      }
    }).catch(() => {
      // If onboarding check fails, let the user through — don't block indefinitely
      setOnboardingChecked(true)
    })
  }, [isLoaded, isSignedIn, router])

  const showSpinner = !isLoaded && !authTimedOut
  // Show spinner while auth is loading OR while onboarding check is pending
  const showAuthShell = isLoaded && isSignedIn && onboardingChecked

  return (
    <div className="relative h-full scanline">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(64,192,208,1) 1px, transparent 1px), linear-gradient(90deg, rgba(64,192,208,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {(showSpinner || (isLoaded && isSignedIn && !onboardingChecked)) && (
        <div className="h-full flex items-center justify-center">
          <div className="text-xs tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
            ACCESS<span className="cursor" />
          </div>
        </div>
      )}

      {authTimedOut && !isLoaded && (
        <div className="h-full flex flex-col items-center justify-center gap-4 px-6">
          <p className="text-xs text-center max-w-md" style={{ color: 'var(--gold)' }}>
            Auth did not finish loading. Restart dev from access-app after adding middleware.ts,
            or check Clerk keys in .env.local.
          </p>
          <TerminalLanding />
        </div>
      )}

      {isLoaded && !isSignedIn && <TerminalLanding />}
      {showAuthShell && <AccessOsShell initialModule="dashboard" />}
    </div>
  )
}
