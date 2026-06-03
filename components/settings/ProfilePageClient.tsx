'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel } from '@/lib/design-system/components/platform'

export default function ProfilePageClient() {
  const { user, isLoaded } = useUser()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isLoaded || !user) {
    return (
      <AccessAppLayout variant="default">
        <div className="access-settings-loading">Loading profile…</div>
      </AccessAppLayout>
    )
  }

  const displayFirst = firstName || user.firstName || ''
  const displayLast = lastName || user.lastName || ''
  const handle = user.username
    ? `${user.username.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.access`
    : user.emailAddresses?.[0]?.emailAddress?.split('@')[0] + '.access'
  const email = user.emailAddresses?.[0]?.emailAddress ?? '—'
  const initials = ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')).toUpperCase() || '?'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await user.update({
        firstName: firstName || user.firstName || undefined,
        lastName: lastName || user.lastName || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-platform-page--wide">
        <PageHeader
          eyebrow="Settings"
          title="Profile"
          description="Your public identity in the ACCESS ecosystem."
        />

        <div className="access-settings-profile-grid">
          {/* Avatar */}
          <SectionPanel title="Avatar">
            <div className="access-profile-avatar-row">
              <div className="access-profile-avatar">
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt="Avatar" />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="access-profile-avatar-meta">
                <p className="access-platform-body">
                  Profile photo is managed through your sign-in provider (Google or GitHub).
                </p>
                <p className="access-platform-meta" style={{ marginTop: 4 }}>
                  Sign in with Google or GitHub to use their profile photo automatically.
                </p>
              </div>
            </div>
          </SectionPanel>

          {/* Identity */}
          <SectionPanel title="Identity">
            <form className="access-settings-form" onSubmit={handleSave}>
              <div className="access-settings-form__row">
                <label className="access-settings-form__label">First name</label>
                <input
                  className="access-settings-form__input"
                  type="text"
                  placeholder={user.firstName ?? 'First name'}
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div className="access-settings-form__row">
                <label className="access-settings-form__label">Last name</label>
                <input
                  className="access-settings-form__input"
                  type="text"
                  placeholder={user.lastName ?? 'Last name'}
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
              <div className="access-settings-form__row">
                <label className="access-settings-form__label">Email</label>
                <input
                  className="access-settings-form__input"
                  type="email"
                  value={email}
                  disabled
                  readOnly
                />
                <p className="access-platform-meta" style={{ marginTop: 4 }}>
                  Email is managed via Clerk. Go to your Clerk account to change it.
                </p>
              </div>
              <div className="access-settings-form__row">
                <label className="access-settings-form__label">ACCESS handle</label>
                <input
                  className="access-settings-form__input access-settings-form__input--mono"
                  type="text"
                  value={handle}
                  disabled
                  readOnly
                />
                <p className="access-platform-meta" style={{ marginTop: 4 }}>
                  Your handle is permanent and derived from your Clerk username. It anchors your Founder OS, JYSON context, and registry objects.
                </p>
              </div>
              {error && <p className="access-settings-form__error">{error}</p>}
              <div className="access-settings-form__actions">
                <button
                  type="submit"
                  className="access-settings-btn access-settings-btn--primary"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
                </button>
              </div>
            </form>
          </SectionPanel>

          {/* Connected accounts */}
          <SectionPanel title="Connected accounts">
            <div className="access-settings-connected">
              {user.externalAccounts.length === 0 ? (
                <p className="access-platform-meta">No external accounts connected.</p>
              ) : (
                user.externalAccounts.map(account => (
                  <div key={account.id} className="access-settings-connected__row">
                    <span className="access-settings-connected__provider">
                      {account.provider.replace('oauth_', '').replace(/^\w/, c => c.toUpperCase())}
                    </span>
                    <span className="access-settings-connected__id">
                      {account.username ?? account.emailAddress ?? account.id}
                    </span>
                    <span className="access-ds-badge access-ds-badge--operational">Connected</span>
                  </div>
                ))
              )}
            </div>
          </SectionPanel>
        </div>
      </div>
    </AccessAppLayout>
  )
}
