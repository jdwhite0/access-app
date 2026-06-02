'use client'

import { useClerk } from '@clerk/nextjs'

type AccessTopbarMetaProps = {
  userLabel?: string | null
}

export default function AccessTopbarMeta({ userLabel }: AccessTopbarMetaProps) {
  const { signOut } = useClerk()

  return (
    <div className="access-nav-topbar-meta">
      {userLabel ? (
        <span className="access-nav-topbar-user">{userLabel}</span>
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
