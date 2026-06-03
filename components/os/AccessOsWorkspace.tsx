'use client'

import AccessHome from '@/components/platform/AccessHome'
import { PageHeader } from '@/lib/design-system/components/platform'
import RegistryModule from './RegistryModule'
import type { RegistrySummary } from '@/types/db'
import type { OsModuleId } from './types'
import type { RegistryRowKey } from './registry-types'

type Props = {
  activeModule: OsModuleId
  summary: RegistrySummary | null
  loading: boolean
  identityError: string | null
  selectedKey: RegistryRowKey | null
  onSelectKey: (key: RegistryRowKey) => void
}

export default function AccessOsWorkspace({
  activeModule,
  summary,
  loading,
  identityError,
  selectedKey,
  onSelectKey,
}: Props) {
  if (activeModule === 'dashboard') {
    return (
      <section className="access-os-workspace access-os-workspace--home" aria-label="Your World">
        <AccessHome
          summary={summary}
          loading={loading}
          identityError={identityError}
        />
      </section>
    )
  }

  if (activeModule !== 'registry') {
    return (
      <section className="access-os-workspace" aria-label="Workspace">
        <header className="access-os-workspace-header">
          <h1 className="access-os-workspace-title">Module unavailable</h1>
          <p className="access-os-workspace-sub">
            This module is not enabled in the current release.
          </p>
        </header>
      </section>
    )
  }

  const registeredTotal = summary?.totalRegistered

  const registryDescription = loading
    ? 'Loading your ACCESS registry…'
    : summary
      ? `${summary.identityHandle} · ${registeredTotal ?? 0} registered object${registeredTotal === 1 ? '' : 's'} across organizations, products, experiences, systems, and agents.`
      : 'Registry data could not be loaded.'

  return (
    <section className="access-platform access-platform-page access-platform-page--wide" aria-label="Registry workspace">
      <PageHeader
        eyebrow="ACCESS"
        title="Your Universe"
        description={registryDescription}
      />

      <RegistryModule
        summary={summary}
        loading={loading}
        identityError={identityError}
        selectedKey={selectedKey}
        onSelectKey={onSelectKey}
      />
    </section>
  )
}
