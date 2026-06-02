'use client'

import type { OsModuleId } from './types'

type Props = {
  activeModule: OsModuleId
}

export default function AccessOsWorkspace({ activeModule }: Props) {
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

  return (
    <section className="access-os-workspace" aria-label="Registry workspace">
      <header className="access-os-workspace-header">
        <p className="access-os-workspace-eyebrow">Identity layer</p>
        <h1 className="access-os-workspace-title">Registry</h1>
        <p className="access-os-workspace-sub">
          Your ACCESS identity registry will load here in Phase 2b. This workspace
          is reserved for systems, agents, projects, and connected records.
        </p>
      </header>

      <div className="access-os-workspace-placeholder">
        <div className="access-os-placeholder-grid">
          {[
            ['Systems', '—'],
            ['Agents', '—'],
            ['Projects', '—'],
            ['Blueprints', '—'],
          ].map(([label, value]) => (
            <div key={label} className="access-os-placeholder-card">
              <span className="access-os-placeholder-label">{label}</span>
              <span className="access-os-placeholder-value">{value}</span>
            </div>
          ))}
        </div>

        <div className="access-os-placeholder-panel">
          <p className="access-os-placeholder-note">
            <span className="access-os-placeholder-accent">Phase 2a</span>
            — Shell layout only. Registry data and actions ship in the next deploy.
          </p>
        </div>
      </div>
    </section>
  )
}
