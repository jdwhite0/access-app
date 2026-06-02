'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { getOrCreateIdentity } from '@/lib/actions/identity'
import { deriveUsername, toAccessHandle } from '@/lib/founder-wizard/client-utils'

type AccountType = 'founder' | 'user'
type OnboardingStep = 'account-type' | 'confirm'

const SESSION_KEY = 'access_onboarding_session'
const SESSION_TTL_MS = 2 * 60 * 1000 // 2 minutes

type StoredSession = {
  accountType: AccountType | null
  step: OnboardingStep
  ts: number
}

function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as StoredSession
    if (Date.now() - stored.ts > SESSION_TTL_MS) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return stored
  } catch {
    return null
  }
}

function saveSession(accountType: AccountType | null, step: OnboardingStep) {
  try {
    const stored: StoredSession = { accountType, step, ts: Date.now() }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(stored))
  } catch { /* ignore storage errors */ }
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
}

export default function OnboardingFlow() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<OnboardingStep>('account-type')

  const username = useMemo(() => deriveUsername(user), [user])
  const handle = useMemo(() => toAccessHandle(username), [username])
  const displayName = useMemo(
    () => user?.fullName || user?.firstName || username,
    [user, username]
  )

  // Restore session from storage on first mount (within TTL)
  useEffect(() => {
    const stored = loadSession()
    if (!stored) return
    if (stored.accountType) setAccountType(stored.accountType)
    if (stored.step) setStep(stored.step)
  }, [])

  // Persist session to storage whenever step or selection changes
  useEffect(() => {
    saveSession(accountType, step)
  }, [accountType, step])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/')
    }
  }, [isLoaded, isSignedIn, router])

  const handleContinue = useCallback(async () => {
    if (!accountType) return
    setBusy(true)
    setError(null)

    try {
      const { identity, error: identityError } = await getOrCreateIdentity(handle)
      if (!identity?.handle) {
        setError(
          identityError ?? 'Could not create your ACCESS identity. Please try again.'
        )
        return
      }

      clearSession()
      if (accountType === 'founder') {
        router.replace('/founder')
      } else {
        router.replace('/dashboard')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }, [accountType, handle, router])

  if (!isLoaded) {
    return (
      <div className="founder-wizard founder-wizard--center">
        <p className="founder-wizard-muted">ACCESS<span className="cursor" /></p>
      </div>
    )
  }

  if (step === 'account-type') {
    return (
      <div className="founder-wizard founder-wizard--onboarding">
        <div className="founder-wizard-card fade-in">
          <header className="founder-wizard-hero">
            <h1 className="founder-wizard-hero-title">You're gaining access.</h1>
            <p className="founder-wizard-hero-subtitle">
              ACCESS is the door to AI infrastructure. Tell us how you're coming through it.
            </p>
          </header>

          <div className="founder-wizard-section">
            <h2 className="founder-wizard-section-title">Who are you?</h2>
          </div>

          <div className="onboarding-account-types">
            <button
              type="button"
              className={`onboarding-type-card${accountType === 'founder' ? ' is-selected' : ''}`}
              onClick={() => setAccountType('founder')}
            >
              <span className="onboarding-type-glyph">◫</span>
              <span className="onboarding-type-name">Founder</span>
              <span className="onboarding-type-desc">
                Creators, founders, and business builders. You get a full Founder OS —
                your own AI infrastructure, connected systems, and JYSON as your intelligence layer.
              </span>
            </button>

            <button
              type="button"
              className={`onboarding-type-card${accountType === 'user' ? ' is-selected' : ''}`}
              onClick={() => setAccountType('user')}
            >
              <span className="onboarding-type-glyph">◎</span>
              <span className="onboarding-type-name">User</span>
              <span className="onboarding-type-desc">
                Everyday users and consumers. You gain access to AI-powered tools,
                content, and experiences built on the ACCESS platform.
              </span>
            </button>
          </div>

          {accountType && (
            <button
              type="button"
              className="auth-primary-btn founder-wizard-cta"
              onClick={() => setStep('confirm')}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="founder-wizard founder-wizard--onboarding">
      <div className="founder-wizard-card fade-in">
        <header className="founder-wizard-hero">
          <h1 className="founder-wizard-hero-title">Confirm Your Identity</h1>
          <p className="founder-wizard-hero-subtitle">
            Your ACCESS handle is how the system knows you permanently.
          </p>
        </header>

        <div className="founder-wizard-id-block">
          <span className="founder-wizard-label">Your name</span>
          <p className="founder-wizard-id-value">{displayName}</p>
        </div>

        <div className="founder-wizard-id-block">
          <span className="founder-wizard-label">Your ACCESS handle</span>
          <span className="founder-wizard-helper">
            Permanent — derived from your sign-in identity
          </span>
          <p className="founder-wizard-id-value">{handle}</p>
        </div>

        <div className="founder-wizard-id-block">
          <span className="founder-wizard-label">Account type</span>
          <p className="founder-wizard-id-value">
            {accountType === 'founder' ? 'Founder' : 'User'}
          </p>
        </div>

        {error && (
          <div className="founder-wizard-errors" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="founder-wizard-actions">
          <button
            type="button"
            className="founder-wizard-btn-secondary"
            disabled={busy}
            onClick={() => setStep('account-type')}
          >
            Back
          </button>
          <button
            type="button"
            className="auth-primary-btn founder-wizard-cta"
            disabled={busy}
            onClick={() => void handleContinue()}
          >
            {busy
              ? 'Setting up…'
              : accountType === 'founder'
                ? 'Claim identity & start Founder Blueprint'
                : 'Claim identity & enter ACCESS'}
          </button>
        </div>
      </div>
    </div>
  )
}
