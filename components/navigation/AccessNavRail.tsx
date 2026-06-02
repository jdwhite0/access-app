'use client'

import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'
import AccessContextNav from './AccessContextNav'
import AccessPrimaryNav from './AccessPrimaryNav'

type AccessNavRailProps = {
  moduleSlot?: ReactNode
}

function ContextNavFallback() {
  return null
}

export default function AccessNavRail({ moduleSlot }: AccessNavRailProps) {
  return (
    <div className="access-nav-rail">
      <div className="access-nav-rail-brand">
        <Link href="/dashboard" className="access-nav-rail-mark" aria-label="ACCESS home">
          ◈
        </Link>
        <Link href="/dashboard" className="access-nav-rail-title">
          ACCESS
        </Link>
      </div>

      <AccessPrimaryNav />

      <Suspense fallback={<ContextNavFallback />}>
        <AccessContextNav />
      </Suspense>

      {moduleSlot ? (
        <div className="access-nav-module-slot">{moduleSlot}</div>
      ) : null}
    </div>
  )
}
