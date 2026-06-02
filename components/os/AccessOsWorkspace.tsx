'use client'

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

  return (
    <section className="access-os-workspace" aria-label="Registry workspace">
      <header className="access-os-workspace-header">
        <p className="access-os-workspace-eyebrow">Identity layer</p>
        <h1 className="access-os-workspace-title">Registry</h1>
        <p className="access-os-workspace-sub">
          {loading
            ? 'Loading your ACCESS registry…'
            : summary
              ? `${summary.identityHandle} · ${registeredTotal ?? 0} registered object${registeredTotal === 1 ? '' : 's'} across systems, agents, projects, and blueprints.`
              : 'Registry data could not be loaded.'}
        </p>
      </header>

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
