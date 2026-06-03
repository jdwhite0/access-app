'use client'

import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import AccessOsShell from './AccessOsShell'
import type { OsModuleId } from './types'

type AccessOsSignedInPageProps = {
  module: OsModuleId
}

export default function AccessOsSignedInPage({ module }: AccessOsSignedInPageProps) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-xs tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
          ACCESS<span className="cursor" />
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="access-os-workspace" style={{ padding: '2rem' }}>
        <p className="access-os-workspace-sub">
          Sign in to open this module.
        </p>
        <Link href="/" className="access-nav-link" style={{ display: 'inline-flex', marginTop: '1rem' }}>
          Sign in to ACCESS
        </Link>
      </div>
    )
  }

  return <AccessOsShell initialModule={module} />
}
