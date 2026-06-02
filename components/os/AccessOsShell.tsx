'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import AccessOsLeftRail from './AccessOsLeftRail'
import AccessOsWorkspace from './AccessOsWorkspace'
import AccessOsContextPanel from './AccessOsContextPanel'
import type { OsModuleId } from './types'

export default function AccessOsShell() {
  const { user, isLoaded } = useUser()
  const [activeModule, setActiveModule] = useState<OsModuleId>('registry')

  const displayName =
    user?.username ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ??
    null

  return (
    <div className="access-os-shell">
      <header className="access-os-topbar">
        <div className="access-os-topbar-trail">
          <span className="access-os-topbar-root">JD AI Systems</span>
          <span className="access-os-topbar-sep" aria-hidden>
            /
          </span>
          <span className="access-os-topbar-current">ACCESS OS</span>
          <span className="access-os-topbar-badge">Live</span>
        </div>
        <div className="access-os-topbar-meta">
          <span className="access-os-topbar-user">
            {isLoaded ? (displayName ?? 'Operator') : '…'}
          </span>
        </div>
      </header>

      <div className="access-os-body">
        <AccessOsLeftRail activeModule={activeModule} onSelect={setActiveModule} />
        <AccessOsWorkspace activeModule={activeModule} />
        <AccessOsContextPanel displayHandle={displayName} />
      </div>
    </div>
  )
}
