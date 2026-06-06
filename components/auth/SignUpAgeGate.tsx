'use client'

import { useEffect, useState } from 'react'

export const AGE_GATE_SESSION_KEY = 'access_age_confirmed'

export default function SignUpAgeGate() {
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    try {
      sessionStorage.setItem(AGE_GATE_SESSION_KEY, confirmed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [confirmed])

  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, fontSize: 13, lineHeight: 1.6, color: '#697386', cursor: 'pointer', userSelect: 'none' }}>
      <input
        type="checkbox"
        checked={confirmed}
        onChange={(e) => setConfirmed(e.target.checked)}
        style={{ marginTop: 3, flexShrink: 0, accentColor: '#0a2540', width: 14, height: 14 }}
        required
      />
      <span>
        I confirm I am at least <strong style={{ color: '#425466', fontWeight: 600 }}>18 years old</strong> and can enter into a binding agreement.{' '}
        <a href="/terms" style={{ color: '#697386', textDecoration: 'underline' }}>Terms apply.</a>
      </span>
    </label>
  )
}
