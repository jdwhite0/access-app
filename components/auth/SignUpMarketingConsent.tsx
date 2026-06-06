'use client'

import { useEffect, useState } from 'react'
import {
  MARKETING_CONSENT_SESSION_KEY,
  SIGNUP_MARKETING_CONSENT_LABEL,
} from '@/lib/email/constants'

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
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20, fontSize: 13, lineHeight: 1.6, color: '#697386', cursor: 'pointer', userSelect: 'none' }}>
      <input
        type="checkbox"
        checked={optIn}
        onChange={(e) => setOptIn(e.target.checked)}
        style={{ marginTop: 3, flexShrink: 0, accentColor: '#0a2540', width: 14, height: 14 }}
      />
      <span>{SIGNUP_MARKETING_CONSENT_LABEL}</span>
    </label>
  )
}
