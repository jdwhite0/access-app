'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import AccessUniversalShell from '@/components/navigation/AccessUniversalShell'
import { PageMotion } from '@/lib/design-system/components/platform'
import AccessOsLeftRail from './AccessOsLeftRail'
import AccessOsWorkspace from './AccessOsWorkspace'
import AccessOsContextPanel from './AccessOsContextPanel'
import { useRegistryData } from './useRegistryData'
import type { OsModuleId } from './types'
import type { RegistryRowKey } from './registry-types'

type AccessOsShellProps = {
  initialModule?: OsModuleId
}

export default function AccessOsShell({ initialModule = 'dashboard' }: AccessOsShellProps) {
  const { user, isLoaded } = useUser()
  const [activeModule, setActiveModule] = useState<OsModuleId>(initialModule)
  const [selectedKey, setSelectedKey] = useState<RegistryRowKey | null>(null)

  const { summary, loading, identityError, accessId } = useRegistryData(user, isLoaded)

  const displayName =
    user?.username ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ??
    null

  const topbarUser = summary?.identityHandle ?? accessId ?? displayName ?? 'Operator'

  return (
    <AccessUniversalShell
      userLabel={isLoaded ? topbarUser : '…'}
      moduleSlot={
        activeModule === 'registry' ? (
          <AccessOsLeftRail activeModule={activeModule} onSelect={setActiveModule} />
        ) : null
      }
      context={
        activeModule === 'registry' ? (
          <AccessOsContextPanel
            summary={summary}
            loading={loading}
            identityError={identityError}
            selectedKey={selectedKey}
          />
        ) : null
      }
    >
      <PageMotion key={activeModule}>
        <AccessOsWorkspace
          activeModule={activeModule}
          summary={summary}
          loading={loading}
          identityError={identityError}
          selectedKey={selectedKey}
          onSelectKey={setSelectedKey}
        />
      </PageMotion>
    </AccessUniversalShell>
  )
}
