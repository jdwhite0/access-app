'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel } from '@/lib/design-system/components/platform'
import { deleteAccountAction } from '@/lib/actions/account'

type PrivacyRequestType = 'access' | 'portability' | 'correction' | 'deletion_request'

const PRIVACY_REQUEST_LABELS: Record<PrivacyRequestType, string> = {
  access:           'Access — Get a copy of my personal data',
  portability:      'Portability — Export my data in a machine-readable format',
  correction:       'Correction — Update inaccurate information on file',
  deletion_request: 'Deletion — Delete my personal data (separate from closing account)',
}

export default function AccountPageClient() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showDanger, setShowDanger] = useState(false)
  const [privacyRequestType, setPrivacyRequestType] = useState<PrivacyRequestType>('access')
  const [privacyRequestSent, setPrivacyRequestSent] = useState(false)
  const [privacyRequestSending, setPrivacyRequestSending] = useState(false)

  async function handlePrivacyRequest() {
    setPrivacyRequestSending(true)
    try {
      await fetch('/api/email/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Privacy Request: ${privacyRequestType}`,
          message: `User ${user?.emailAddresses?.[0]?.emailAddress ?? user?.id} has submitted a Florida/Georgia FDBR privacy request: ${PRIVACY_REQUEST_LABELS[privacyRequestType]}`,
          type: 'privacy_request',
        }),
      })
      setPrivacyRequestSent(true)
    } finally {
      setPrivacyRequestSending(false)
    }
  }

  const handle = user?.username
    ? `${user.username.toLowerCase()}.access`
    : (user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? 'unknown') + '.access'

  async function handleDeleteAccount() {
    if (deleteConfirm !== handle) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteAccountAction()
      await signOut()
      router.push('/')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed.')
      setDeleting(false)
    }
  }

  if (!isLoaded || !user) {
    return (
      <AccessAppLayout variant="default">
        <div className="access-settings-loading">Loading account…</div>
      </AccessAppLayout>
    )
  }

  const sessions = user.organizationMemberships ?? []

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-shell-page access-shell-page--wide">
        <PageHeader
          eyebrow="Settings"
          title="Account"
          description="Security, sessions, and account management."
        />

        <div className="access-settings-profile-grid">
          {/* Account overview */}
          <SectionPanel title="Account overview">
            <div className="access-settings-info-grid">
              <div className="access-settings-info-row">
                <span className="access-platform-meta">ACCESS handle</span>
                <span className="access-settings-info-value access-settings-info-value--mono">{handle}</span>
              </div>
              <div className="access-settings-info-row">
                <span className="access-platform-meta">Email</span>
                <span className="access-settings-info-value">{user.emailAddresses?.[0]?.emailAddress ?? '—'}</span>
              </div>
              <div className="access-settings-info-row">
                <span className="access-platform-meta">Account created</span>
                <span className="access-settings-info-value">
                  {new Date(user.createdAt ?? Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="access-settings-info-row">
                <span className="access-platform-meta">Clerk user ID</span>
                <span className="access-settings-info-value access-settings-info-value--mono" style={{ fontSize: '0.72rem' }}>{user.id}</span>
              </div>
            </div>
          </SectionPanel>

          {/* Security */}
          <SectionPanel title="Security">
            <p className="access-platform-body" style={{ marginBottom: '16px' }}>
              Password changes, two-factor authentication, and session management are handled through your Clerk account dashboard.
            </p>
            <a
              href="https://accounts.clerk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="access-settings-btn access-settings-btn--secondary"
            >
              Manage security in Clerk ↗
            </a>
          </SectionPanel>

          {/* Privacy request — FDBR / Florida + Georgia compliance */}
          <SectionPanel title="Privacy request">
            <p className="access-platform-body" style={{ marginBottom: 12 }}>
              Under the Florida Digital Bill of Rights (FDBR) and Georgia consumer protection law,
              you have the right to access, correct, export, or delete your personal data.
              We respond within 45 days.
            </p>
            {privacyRequestSent ? (
              <p className="access-platform-body" style={{ color: '#2D8A6E', marginBottom: 12 }}>
                Request received. We&apos;ll respond to {user?.emailAddresses?.[0]?.emailAddress} within 45 days.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {(Object.entries(PRIVACY_REQUEST_LABELS) as [PrivacyRequestType, string][]).map(([val, label]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#425466', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="privacy_request_type"
                        value={val}
                        checked={privacyRequestType === val}
                        onChange={() => setPrivacyRequestType(val)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <button
                  className="access-settings-btn access-settings-btn--secondary"
                  onClick={handlePrivacyRequest}
                  disabled={privacyRequestSending}
                >
                  {privacyRequestSending ? 'Submitting…' : 'Submit privacy request'}
                </button>
              </>
            )}
            <p className="access-platform-meta" style={{ marginTop: 12 }}>
              To delete your account entirely, use the Danger zone below.{' '}
              <Link href="/privacy" style={{ color: '#697386' }}>Privacy Policy ↗</Link>
            </p>
          </SectionPanel>

          {/* Danger zone */}
          <SectionPanel title="Danger zone">
            {!showDanger ? (
              <div className="access-danger-intro">
                <p className="access-platform-body">
                  Deleting your account permanently removes your ACCESS identity, Founder OS blueprint, registry objects, and all associated data. This cannot be undone.
                </p>
                <button
                  className="access-settings-btn access-settings-btn--danger"
                  style={{ marginTop: '16px' }}
                  onClick={() => setShowDanger(true)}
                >
                  Delete my account
                </button>
              </div>
            ) : (
              <div className="access-danger-confirm">
                <p className="access-platform-body" style={{ marginBottom: '12px' }}>
                  To confirm, type your ACCESS handle: <strong style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{handle}</strong>
                </p>
                <input
                  className="access-settings-form__input access-settings-form__input--mono"
                  type="text"
                  placeholder={handle}
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                />
                {deleteError && (
                  <p className="access-settings-form__error" style={{ marginTop: '8px' }}>{deleteError}</p>
                )}
                <div className="access-settings-form__actions" style={{ marginTop: '16px' }}>
                  <button
                    className="access-settings-btn access-settings-btn--ghost"
                    onClick={() => { setShowDanger(false); setDeleteConfirm('') }}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="access-settings-btn access-settings-btn--danger"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== handle || deleting}
                  >
                    {deleting ? 'Deleting…' : 'Permanently delete account'}
                  </button>
                </div>
              </div>
            )}
          </SectionPanel>
        </div>
      </div>
    </AccessAppLayout>
  )
}
