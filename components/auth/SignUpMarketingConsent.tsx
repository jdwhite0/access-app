'use client'

import { useEffect, useState } from 'react'
import {
  MARKETING_CONSENT_SESSION_KEY,
  SIGNUP_MARKETING_CONSENT_LABEL,
} from '@/lib/email/constants'

/**
 * Optional marketing consent on signup — not required to create an account.
 * Value is persisted to sessionStorage and processed on onboarding (see OnboardingFlow).
 */
export default function SignUpMarketingConsent() {
  const [optIn, setOptIn] = useState(false)

  useEffect(() => {
    try {
      sessionStorage.setItem(MARKETING_CONSENT_SESSION_KEY, optIn ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [optIn])

  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        marginTop: 20,
        padding: '14px 16px',
        borderRadius: 8,
        border: '1px solid #e6ebf1',
        background: '#f9fafb',
        cursor: 'pointer',
        fontSize: 13,
        lineHeight: 1.5,
        color: '#425466',
      }}
    >
      <input
        type="checkbox"
        checked={optIn}
        onChange={(e) => setOptIn(e.target.checked)}
        style={{ marginTop: 3, flexShrink: 0 }}
      />
      <span>{SIGNUP_MARKETING_CONSENT_LABEL}</span>
    </label>
  )
}
