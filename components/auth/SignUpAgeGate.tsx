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
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        marginTop: 16,
        padding: '12px 16px',
        borderRadius: 8,
        border: confirmed ? '1px solid #d1fae5' : '1px solid #e6ebf1',
        background: confirmed ? '#f0fdf4' : '#f9fafb',
        cursor: 'pointer',
        fontSize: 13,
        lineHeight: 1.5,
        color: '#425466',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <input
        type="checkbox"
        checked={confirmed}
        onChange={(e) => setConfirmed(e.target.checked)}
        style={{ marginTop: 3, flexShrink: 0 }}
        required
      />
      <span>
        I confirm that I am at least <strong>18 years old</strong> and have the legal capacity
        to enter into a binding agreement. (Required by our{' '}
        <a href="/terms" style={{ color: '#697386' }}>Terms of Service</a>.)
      </span>
    </label>
  )
}
