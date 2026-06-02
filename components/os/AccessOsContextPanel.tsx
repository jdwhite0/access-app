'use client'

import { UserButton, useUser } from '@clerk/nextjs'

type Props = {
  displayHandle: string | null
}

export default function AccessOsContextPanel({ displayHandle }: Props) {
  const { user, isLoaded } = useUser()

  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null

  const handlePreview = displayHandle
    ? `${displayHandle.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}.access`
    : '—.access'

  return (
    <aside className="access-os-context" aria-label="Identity context">
      <div className="access-os-context-header">
        <span className="access-os-context-eyebrow">Context</span>
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'access-os-user-avatar',
            },
          }}
        />
      </div>

      <div className="access-os-context-card">
        <h2 className="access-os-context-title">Identity</h2>
        <p className="access-os-context-desc">
          Presence, handle, and verification status appear here when the registry
          module connects in Phase 2b.
        </p>

        <dl className="access-os-context-fields">
          <div className="access-os-context-field">
            <dt>ACCESS handle</dt>
            <dd className="access-os-context-handle">{isLoaded ? handlePreview : '…'}</dd>
          </div>
          <div className="access-os-context-field">
            <dt>Session</dt>
            <dd>{isLoaded && user ? 'Verified' : '…'}</dd>
          </div>
          <div className="access-os-context-field">
            <dt>Login</dt>
            <dd className="access-os-context-email">
              {isLoaded ? (primaryEmail ?? '—') : '…'}
            </dd>
          </div>
          <div className="access-os-context-field">
            <dt>Registry</dt>
            <dd>Placeholder</dd>
          </div>
        </dl>
      </div>

      <div className="access-os-context-footer">
        <p>Context panel updates with workspace selection in Phase 2b.</p>
      </div>
    </aside>
  )
}
