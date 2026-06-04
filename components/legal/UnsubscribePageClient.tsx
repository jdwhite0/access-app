'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

type Preview = {
  email: string
  category: string
  categoryLabel: string
}

type Props = {
  token: string | null
}

export default function UnsubscribePageClient({ token }: Props) {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Missing unsubscribe token.')
      return
    }
    fetch(`/api/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error((j as { error?: string }).error ?? 'Invalid link')
        }
        return res.json()
      })
      .then((data: { preview: Preview }) => setPreview(data.preview))
      .catch((e: Error) => setError(e.message))
  }, [token])

  const submit = useCallback(
    async (scope: 'category' | 'all_marketing') => {
      if (!token) return
      setSubmitting(true)
      setError(null)
      try {
        const res = await fetch('/api/email/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, scope }),
        })
        const j = await res.json()
        if (!res.ok) throw new Error((j as { error?: string }).error ?? 'Unsubscribe failed')
        setDone(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unsubscribe failed')
      } finally {
        setSubmitting(false)
      }
    },
    [token]
  )

  return (
    <div className="access-legal-page">
      <div className="access-legal-card">
        <p className="access-legal-eyebrow">ACCESS</p>
        <h1>Unsubscribe</h1>

        {done ? (
          <>
            <p className="access-legal-lead">You have been unsubscribed. Required account emails (security, billing, connector alerts) will still be sent when needed.</p>
            <Link href="/email-preferences" className="access-settings-btn access-settings-btn--secondary">
              Email preferences
            </Link>
          </>
        ) : error ? (
          <p className="access-settings-form__error">{error}</p>
        ) : !preview ? (
          <p className="access-legal-lead">Verifying your link…</p>
        ) : (
          <>
            <p className="access-legal-lead">
              Manage emails for <strong>{preview.email}</strong>. You can unsubscribe from{' '}
              <strong>{preview.categoryLabel}</strong> only, or pause all marketing emails.
            </p>
            <p className="access-legal-note">
              Transactional emails (verification, password reset, billing, connector/sync alerts) cannot be unsubscribed here.
            </p>
            <div className="access-legal-actions">
              <button
                type="button"
                className="access-settings-btn access-settings-btn--secondary"
                disabled={submitting}
                onClick={() => void submit('category')}
              >
                Unsubscribe from this category only
              </button>
              <button
                type="button"
                className="access-settings-btn access-settings-btn--primary"
                disabled={submitting}
                onClick={() => void submit('all_marketing')}
              >
                Unsubscribe from all marketing emails
              </button>
            </div>
            <p style={{ marginTop: 20, fontSize: 12 }}>
              <Link href="/settings/notifications-email">Manage email preferences</Link>
              {' · '}
              <Link href="/privacy">Privacy</Link>
              {' · '}
              <Link href="/terms">Terms</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
