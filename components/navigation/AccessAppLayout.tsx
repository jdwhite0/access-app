'use client'

import { Suspense, type ReactNode } from 'react'
import { ACCESSShell } from '@/lib/design-system/shell/ACCESSShell'
import AccessBreadcrumbs from './AccessBreadcrumbs'
import AccessNavRail from './AccessNavRail'
import AccessTopbarMeta from './AccessTopbarMeta'

type AccessAppLayoutProps = {
  children: ReactNode
  userLabel?: string | null
  variant?: 'founder' | 'companion' | 'default'
}

function BreadcrumbFallback() {
  return (
    <nav className="access-nav-breadcrumbs" aria-label="Breadcrumb">
      <span className="access-nav-breadcrumb-current">ACCESS</span>
    </nav>
  )
}

/** Full-page layout for Founder, Companion, Settings, Command Center */
export default function AccessAppLayout({
  children,
  userLabel,
  variant = 'default',
}: AccessAppLayoutProps) {
  return (
    <div className={`access-app-layout access-app-layout--${variant}`}>
      <ACCESSShell
        legacyClassName="access-app-layout-shell"
        topbar={
          <div className="access-nav-topbar-row">
            <div className="access-nav-topbar-start">
              <Suspense fallback={<BreadcrumbFallback />}>
                <AccessBreadcrumbs />
              </Suspense>
            </div>
            <AccessTopbarMeta userLabel={userLabel} />
          </div>
        }
        navigation={<AccessNavRail />}
      >
        <div className="access-app-layout__main">{children}</div>
      </ACCESSShell>
    </div>
  )
}
