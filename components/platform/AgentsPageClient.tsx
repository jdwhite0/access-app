'use client'

import { useEffect, useState } from 'react'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel, PlatformEmptyState } from '@/lib/design-system/components/platform'
import { listAgents } from '@/lib/actions/agents'
import type { Agent } from '@/types/db'

type OJHealth = { localToolsAvailable: boolean; connectorOnline: boolean; message?: string }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AgentsPageClient() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [ojHealth, setOjHealth] = useState<OJHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listAgents().catch(() => [] as Agent[]),
      fetch('/api/jyson/openjarvis/health', { cache: 'no-store' })
        .then(r => r.json() as Promise<{ runtime?: OJHealth }>)
        .then(d => d.runtime ?? null)
        .catch(() => null),
    ]).then(([ag, health]) => {
      setAgents(ag)
      setOjHealth(health)
    }).finally(() => setLoading(false))
  }, [])

  const active = agents.filter(a => a.status === 'active')
  const inactive = agents.filter(a => a.status !== 'active' && a.status !== 'archived')

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page">
        <PageHeader
          eyebrow="ACCESS"
          title="Agents"
          description="Your AI team — JYSON as primary intelligence, OpenJarvis for local execution, and any custom agents you've registered."
        />

        {loading ? (
          <div className="access-platform-loading">Loading agents…</div>
        ) : (
          <>
            {/* JYSON — always shown first */}
            <SectionPanel title="Primary intelligence">
              <div className="access-agent-card access-agent-card--jyson">
                <div className="access-agent-card__header">
                  <div className="access-agent-card__avatar">◎</div>
                  <div>
                    <p className="access-agent-card__name">JYSON</p>
                    <p className="access-agent-card__role">Primary companion intelligence</p>
                  </div>
                  <span className="access-ds-badge access-ds-badge--operational">Active</span>
                </div>
                <div className="access-agent-capabilities">
                  <div className="access-agent-cap">
                    <span className="access-agent-cap__label">Cloud</span>
                    <span className={`access-ds-badge access-ds-badge--${true ? 'operational' : 'offline'}`}>Online</span>
                  </div>
                  <div className="access-agent-cap">
                    <span className="access-agent-cap__label">Local connector</span>
                    <span className={`access-ds-badge access-ds-badge--${ojHealth?.connectorOnline ? 'operational' : 'neutral'}`}>
                      {ojHealth?.connectorOnline ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                  <div className="access-agent-cap">
                    <span className="access-agent-cap__label">Local tools</span>
                    <span className={`access-ds-badge access-ds-badge--${ojHealth?.localToolsAvailable ? 'operational' : 'neutral'}`}>
                      {ojHealth?.localToolsAvailable ? 'Live' : 'Offline'}
                    </span>
                  </div>
                </div>
                {!ojHealth?.localToolsAvailable && (
                  <p className="access-platform-meta" style={{ marginTop: 12 }}>
                    {ojHealth?.message ?? 'Start OpenJarvis and the connector heartbeat to enable local tool execution.'}
                  </p>
                )}
              </div>
            </SectionPanel>

            {/* OpenJarvis */}
            <SectionPanel title="Execution layer">
              <div className="access-agent-card">
                <div className="access-agent-card__header">
                  <div className="access-agent-card__avatar">⚙</div>
                  <div>
                    <p className="access-agent-card__name">OpenJarvis</p>
                    <p className="access-agent-card__role">Local tool executor — files, vault, models, browser</p>
                  </div>
                  <span className={`access-ds-badge access-ds-badge--${ojHealth?.localToolsAvailable ? 'operational' : 'offline'}`}>
                    {ojHealth?.localToolsAvailable ? 'Online' : 'Offline'}
                  </span>
                </div>
                <div className="access-agent-capabilities">
                  {['read_file', 'list_files', 'read_vault_note', 'run_local_model', 'read_calendar'].map(tool => (
                    <div key={tool} className="access-agent-cap">
                      <span className="access-agent-cap__label" style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem' }}>{tool}</span>
                      <span className={`access-ds-badge access-ds-badge--${ojHealth?.localToolsAvailable ? 'operational' : 'neutral'}`}>
                        {ojHealth?.localToolsAvailable ? 'Ready' : 'Offline'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionPanel>

            {/* Registered agents */}
            {agents.length > 0 ? (
              <SectionPanel
                title={`Registered agents (${agents.length})`}
                description="Custom agents you've registered in your ACCESS universe."
              >
                <div className="access-offers-grid">
                  {active.map(agent => (
                    <div key={agent.id} className="access-agent-card">
                      <div className="access-agent-card__header">
                        <div className="access-agent-card__avatar">◉</div>
                        <div>
                          <p className="access-agent-card__name">{agent.name}</p>
                          {agent.role && <p className="access-agent-card__role">{agent.role}</p>}
                        </div>
                        <span className={`access-ds-badge access-ds-badge--${agent.status === 'active' ? 'operational' : 'neutral'}`}>
                          {agent.status}
                        </span>
                      </div>
                      {agent.description && (
                        <p className="access-agent-card__desc">{agent.description}</p>
                      )}
                      <p className="access-platform-meta" style={{ marginTop: 12 }}>Registered {fmtDate(agent.created_at)}</p>
                    </div>
                  ))}
                  {inactive.map(agent => (
                    <div key={agent.id} className="access-agent-card access-agent-card--dim">
                      <div className="access-agent-card__header">
                        <div className="access-agent-card__avatar">◉</div>
                        <div>
                          <p className="access-agent-card__name">{agent.name}</p>
                          {agent.role && <p className="access-agent-card__role">{agent.role}</p>}
                        </div>
                        <span className="access-ds-badge access-ds-badge--neutral">{agent.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionPanel>
            ) : (
              <SectionPanel title="Registered agents">
                <PlatformEmptyState
                  title="No custom agents yet"
                  description="Register agents from the terminal with /register-agent. Agents represent AI tools, automations, and team members connected to your systems."
                  actionHref="/terminal"
                  actionLabel="Register an agent"
                />
              </SectionPanel>
            )}
          </>
        )}
      </div>
    </AccessAppLayout>
  )
}
