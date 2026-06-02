'use client'

/**
 * Public landing page — ACCESS.
 *
 * Three layers, three URLs:
 *   /          → public landing  (sells ACCESS)
 *   /onboarding → account setup   (configures ACCESS)
 *   /dashboard  → operating shell (operates ACCESS)
 *
 * Signed-in users are always routed away from / based on their onboarding state.
 * Unauthenticated users always see TerminalLanding.
 */
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import TerminalLanding from '@/components/TerminalLanding'
import { getOnboardingState } from '@/lib/actions/onboarding'

const AUTH_LOAD_TIMEOUT_MS = 12_000

export default function Page() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const [authTimedOut, setAuthTimedOut] = useState(false)

  // Auth timeout fallback — shows landing if Clerk never resolves
  useEffect(() => {
    if (isLoaded) {
      setAuthTimedOut(false)
      return
    }
    const t = window.setTimeout(() => setAuthTimedOut(true), AUTH_LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(t)
  }, [isLoaded])

  // Routing gate — runs once auth is known
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) return // unauthenticated users stay on landing

    // Signed-in users are always routed away from /
    getOnboardingState()
      .then((state) => {
        const dest = state.redirectTo ?? '/dashboard'
        router.replace(dest)
      })
      .catch(() => {
        // If state check fails, fall through to dashboard
        router.replace('/dashboard')
      })
  }, [isLoaded, isSignedIn, router])

  // Spinner while Clerk is loading (not timed out)
  if (!isLoaded && !authTimedOut) {
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
        <div className="h-full flex items-center justify-center">
          <div className="text-xs tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
            ACCESS<span className="cursor" />
          </div>
        </div>
      </div>
    )
  }

  // Spinner while gate resolves for signed-in users
  if (isLoaded && isSignedIn) {
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
        <div className="h-full flex items-center justify-center">
          <div className="text-xs tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
            ACCESS<span className="cursor" />
          </div>
        </div>
      </div>
    )
  }

  // Public landing — unauthenticated (or auth-timed-out) users
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
      {authTimedOut && !isLoaded && (
        <p className="text-xs text-center max-w-md mx-auto pt-8" style={{ color: 'var(--gold)' }}>
          Auth did not finish loading. Check your Clerk keys in .env.local.
        </p>
      )}
      <TerminalLanding />
    </div>
  )
}
