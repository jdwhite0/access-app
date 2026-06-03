'use client'

import { useClerk } from '@clerk/nextjs'

type AccessTopbarMetaProps = {
  userLabel?: string | null
}

export default function AccessTopbarMeta({ userLabel }: AccessTopbarMetaProps) {
  const { signOut } = useClerk()

  const initial = userLabel?.trim().charAt(0).toUpperCase() ?? null

  return (
    <div className="access-nav-topbar-meta">
      {userLabel ? (
        <div className="access-nav-topbar-account">
          {initial ? (
            <span className="access-nav-topbar-avatar" aria-hidden>
              {initial}
            </span>
          ) : null}
          <span className="access-nav-topbar-user">{userLabel}</span>
        </div>
      ) : null}
      <button
        type="button"
        className="access-nav-sign-out"
        onClick={() => signOut({ redirectUrl: '/' })}
      >
        Sign out
      </button>
    </div>
  )
}
