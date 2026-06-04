'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { getOrCreateIdentity } from '@/lib/actions/identity'
import { completeOnboarding } from '@/lib/actions/ai-profile'
import { processSignupMarketingConsentAction } from '@/lib/actions/email-preferences'
import { MARKETING_CONSENT_SESSION_KEY } from '@/lib/email/constants'
import { deriveUsername, toAccessHandle } from '@/lib/founder-wizard/client-utils'

type AccountType = 'founder' | 'user'
type OnboardingStep = 'account-type' | 'jyson-context' | 'confirm'

const SESSION_KEY = 'access_onboarding_session'
const SESSION_TTL_MS = 5 * 60 * 1000

type StoredSession = {
  accountType: AccountType | null
  step: OnboardingStep
  answers: Record<string, string>
  ts: number
}

const JYSON_QUESTIONS = [
  { id: 'what_building',   label: 'What are you building?',             placeholder: 'A brand, a product, a service, a system…' },
  { id: 'what_have',       label: 'What do you already have?',          placeholder: 'Skills, experience, audience, assets, IP…' },
  { id: 'what_sell',       label: 'What do you sell or want to sell?',  placeholder: 'Services, products, memberships, content…' },
  { id: 'who_serve',       label: 'Who do you serve?',                  placeholder: 'Clients, audiences, teams, communities…' },
  { id: 'goals',           label: 'What are your main goals?',          placeholder: 'Revenue, freedom, impact, scale, legacy…' },
  { id: 'systems_needed',  label: 'What systems do you need?',          placeholder: 'Automation, workflows, processes, tools…' },
  { id: 'ai_help',         label: 'What should your AI help you with?', placeholder: 'Strategy, creation, management, decisions…' },
  { id: 'ai_name',         label: 'What do you want to name your AI?',  placeholder: 'JYSON (default), or choose your own name' },
] as const

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
  } catch { return null }
}

function saveSession(s: Omit<StoredSession, 'ts'>) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...s, ts: Date.now() })) } catch {}
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY) } catch {}
}

export default function OnboardingFlow() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<OnboardingStep>('account-type')

  const username = useMemo(() => deriveUsername(user), [user])
  const handle = useMemo(() => toAccessHandle(username), [username])
  const displayName = useMemo(
    () => user?.fullName || user?.firstName || username,
    [user, username]
  )

  useEffect(() => {
    const stored = loadSession()
    if (!stored) return
    if (stored.accountType) setAccountType(stored.accountType)
    if (stored.step) setStep(stored.step)
    if (stored.answers) setAnswers(stored.answers)
  }, [])

  useEffect(() => {
    saveSession({ accountType, step, answers })
  }, [accountType, step, answers])

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace('/')
  }, [isLoaded, isSignedIn, router])

  const handleContinue = useCallback(async () => {
    if (!accountType) return
    setBusy(true)
    setError(null)
    try {
      const { identity, error: identityError } = await getOrCreateIdentity(handle)
      if (!identity?.handle) {
        setError(identityError ?? 'Could not create your ACCESS identity. Please try again.')
        return
      }
      let marketingOptIn = false
      try {
        marketingOptIn = sessionStorage.getItem(MARKETING_CONSENT_SESSION_KEY) === '1'
        sessionStorage.removeItem(MARKETING_CONSENT_SESSION_KEY)
      } catch { /* ignore */ }
      await processSignupMarketingConsentAction(marketingOptIn)
      // Save JYSON personalization
      await completeOnboarding(answers)
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
  }, [accountType, handle, router, answers])

  if (!isLoaded) {
    return (
      <div className="founder-wizard founder-wizard--center">
        <p className="founder-wizard-muted">ACCESS<span className="cursor" /></p>
      </div>
    )
  }

  // ── Step 1: Account type ──────────────────────────────────────────────────

  if (step === 'account-type') {
    return (
      <div className="founder-wizard founder-wizard--onboarding access-platform access-platform-page">
        <div className="founder-wizard-card fade-in">
          <header className="founder-wizard-hero">
            <h1 className="founder-wizard-hero-title">You&apos;re gaining access.</h1>
            <p className="founder-wizard-hero-subtitle">
              ACCESS is your operating layer — identity in the cloud, Founder OS for builders,
              and JYSON as your AI operator. Let&apos;s set up your workspace.
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
              <span className="onboarding-type-glyph">◈</span>
              <div>
                <p className="onboarding-type-title">Founder / Builder</p>
                <p className="onboarding-type-desc">
                  Building something — a product, business, system, brand, or creative project.
                  ACCESS with Founder OS, JYSON intelligence, and local connector.
                </p>
              </div>
            </button>
            <button
              type="button"
              className={`onboarding-type-card${accountType === 'user' ? ' is-selected' : ''}`}
              onClick={() => setAccountType('user')}
            >
              <span className="onboarding-type-glyph">◉</span>
              <div>
                <p className="onboarding-type-title">Operator / User</p>
                <p className="onboarding-type-desc">
                  Using ACCESS to manage projects, knowledge, and systems.
                  JYSON helps you stay organized and compound your work.
                </p>
              </div>
            </button>
          </div>

          {accountType && (
            <button
              type="button"
              className="auth-primary-btn founder-wizard-cta"
              onClick={() => setStep('jyson-context')}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── Step 2: JYSON context questions ──────────────────────────────────────

  if (step === 'jyson-context') {
    return (
      <div className="founder-wizard founder-wizard--onboarding access-platform access-platform-page">
        <div className="founder-wizard-card fade-in" style={{ maxWidth: 620 }}>
          <header className="founder-wizard-hero">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), #1a8fa0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontFamily: 'var(--mono)', fontWeight: 700 }}>J</div>
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>JYSON Setup</span>
            </div>
            <h1 className="founder-wizard-hero-title">Tell JYSON who you are.</h1>
            <p className="founder-wizard-hero-subtitle">
              Your answers personalize your AI operator. JYSON uses this context in every session to give you relevant, compounding guidance.
              All fields are optional — answer what feels right.
            </p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {JYSON_QUESTIONS.map((q) => (
              <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', letterSpacing: '0.02em' }}>
                  {q.label}
                </label>
                <input
                  type="text"
                  className="access-settings-form__input"
                  placeholder={q.placeholder}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="founder-wizard-actions" style={{ marginTop: 28 }}>
            <button
              type="button"
              className="founder-wizard-btn-secondary"
              onClick={() => setStep('account-type')}
            >
              Back
            </button>
            <button
              type="button"
              className="auth-primary-btn founder-wizard-cta"
              onClick={() => setStep('confirm')}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 3: Confirm ──────────────────────────────────────────────────────

  const aiName = answers['ai_name']?.trim() || 'JYSON'

  return (
    <div className="founder-wizard founder-wizard--onboarding access-platform access-platform-page">
      <div className="founder-wizard-card fade-in">
        <header className="founder-wizard-hero">
          <h1 className="founder-wizard-hero-title">Your workspace is ready.</h1>
          <p className="founder-wizard-hero-subtitle">
            Your identity anchors your Founder OS, {aiName} context, and registry objects.
          </p>
        </header>

        <div className="founder-wizard-id-block">
          <span className="founder-wizard-label">Your name</span>
          <p className="founder-wizard-id-value">{displayName}</p>
        </div>

        <div className="founder-wizard-id-block">
          <span className="founder-wizard-label">Your ACCESS handle</span>
          <span className="founder-wizard-helper">Permanent — derived from your sign-in identity</span>
          <p className="founder-wizard-id-value">{handle}</p>
        </div>

        <div className="founder-wizard-id-block">
          <span className="founder-wizard-label">Account type</span>
          <p className="founder-wizard-id-value">{accountType === 'founder' ? 'Founder / Builder' : 'Operator / User'}</p>
        </div>

        <div className="founder-wizard-id-block">
          <span className="founder-wizard-label">Your AI operator</span>
          <p className="founder-wizard-id-value" style={{ color: 'var(--accent)' }}>{aiName}</p>
        </div>

        {error && (
          <div className="founder-wizard-errors" role="alert"><p>{error}</p></div>
        )}

        <div className="founder-wizard-actions">
          <button
            type="button"
            className="founder-wizard-btn-secondary"
            disabled={busy}
            onClick={() => setStep('jyson-context')}
          >
            Back
          </button>
          <button
            type="button"
            className="auth-primary-btn founder-wizard-cta"
            disabled={busy}
            onClick={() => void handleContinue()}
          >
            {busy ? 'Setting up…' : accountType === 'founder' ? 'Launch workspace' : 'Enter ACCESS'}
          </button>
        </div>
      </div>
    </div>
  )
}
