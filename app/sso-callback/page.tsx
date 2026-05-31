'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

export default function SSOCallback() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="text-sm tracking-widest" style={{ color: 'var(--accent)' }}>
          ACCESS
        </div>
        <div className="text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>
          verifying identity<span className="cursor" />
        </div>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
