'use client'

import { UserButton, useClerk, useUser } from '@clerk/nextjs'
import type { RegistrySummary } from '@/types/db'
import { REGISTRY_ROW_LABELS, type RegistryRowKey } from './registry-types'

type Props = {
  summary: RegistrySummary | null
  loading: boolean
  identityError: string | null
  selectedKey: RegistryRowKey | null
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AccessOsContextPanel({
  summary,
  loading,
  identityError,
  selectedKey,
}: Props) {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()

  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null

  const handle = summary?.identityHandle ?? '—'
  const selectedLabel = selectedKey ? REGISTRY_ROW_LABELS[selectedKey] : null
  const selectedCount = selectedKey && summary ? summary.counts[selectedKey] : null
  const selectedStatus =
    selectedCount === null
      ? null
      : selectedCount > 0
        ? `${selectedCount} registered`
        : 'No records'

  return (
    <aside className="access-os-context" aria-label="Identity context">
      <div className="access-os-context-header">
        <span className="access-os-context-eyebrow">Context</span>
        {isLoaded && user && (
          <div className="access-os-context-user-actions">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'access-os-user-avatar',
                },
              }}
            />
            <button
              type="button"
              className="access-os-sign-out-btn"
              onClick={() => signOut({ redirectUrl: '/' })}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      <div className="access-os-context-card">
        <h2 className="access-os-context-title">
          {selectedLabel ? selectedLabel : 'Identity'}
        </h2>
        <p className="access-os-context-desc">
          {selectedLabel
            ? `Registry record for ${selectedLabel.toLowerCase()} in your ACCESS identity.`
            : 'Your verified ACCESS identity and registry totals from Supabase.'}
        </p>

        {identityError && (
          <p className="access-os-context-alert" role="alert">
            {identityError}
          </p>
        )}

        <dl className="access-os-context-fields">
          {selectedKey && summary ? (
            <>
              <div className="access-os-context-field">
                <dt>Module</dt>
                <dd>{selectedLabel}</dd>
              </div>
              <div className="access-os-context-field">
                <dt>Count</dt>
                <dd className="access-os-context-handle">{selectedCount}</dd>
              </div>
              <div className="access-os-context-field">
                <dt>Status</dt>
                <dd>{selectedStatus}</dd>
              </div>
              <div className="access-os-context-field">
                <dt>Owner</dt>
                <dd className="access-os-context-handle">{summary.identityHandle}</dd>
              </div>
            </>
          ) : (
            <>
              <div className="access-os-context-field">
                <dt>ACCESS handle</dt>
                <dd className="access-os-context-handle">
                  {loading ? '…' : handle}
                </dd>
              </div>
              <div className="access-os-context-field">
                <dt>Identity since</dt>
                <dd>{loading ? '…' : fmtDate(summary?.identityCreatedAt ?? null)}</dd>
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
                <dt>Total registered</dt>
                <dd>{loading ? '…' : (summary?.totalRegistered ?? 0)}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      <div className="access-os-context-footer">
        <p>
          {selectedKey
            ? 'Select another registry row or stat card to update context.'
            : 'Select a registry row to inspect module details.'}
        </p>
      </div>
    </aside>
  )
}
