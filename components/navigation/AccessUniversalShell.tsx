'use client'

import { Suspense, type ReactNode } from 'react'
import { ACCESSShell } from '@/lib/design-system/shell/ACCESSShell'
import AccessBreadcrumbs from './AccessBreadcrumbs'
import AccessNavRail from './AccessNavRail'
import AccessTopbarMeta from './AccessTopbarMeta'

type AccessUniversalShellProps = {
  children: ReactNode
  context?: ReactNode
  moduleSlot?: ReactNode
  userLabel?: string | null
  showLiveBadge?: boolean
}

function BreadcrumbFallback() {
  return (
    <nav className="access-nav-breadcrumbs" aria-label="Breadcrumb">
      <span className="access-nav-breadcrumb-current">ACCESS</span>
    </nav>
  )
}

export default function AccessUniversalShell({
  children,
  context,
  moduleSlot,
  userLabel,
  showLiveBadge = true,
}: AccessUniversalShellProps) {
  return (
    <ACCESSShell
      topbar={
        <div className="access-nav-topbar-row">
          <div className="access-nav-topbar-start">
            <Suspense fallback={<BreadcrumbFallback />}>
              <AccessBreadcrumbs />
            </Suspense>
            {showLiveBadge ? (
              <span className="access-nav-topbar-badge">Live</span>
            ) : null}
          </div>
          <AccessTopbarMeta userLabel={userLabel} />
        </div>
      }
      navigation={<AccessNavRail moduleSlot={moduleSlot} />}
      context={context}
    >
      {children}
    </ACCESSShell>
  )
}
