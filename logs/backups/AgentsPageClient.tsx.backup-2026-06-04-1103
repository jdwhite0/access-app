'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { ConnectLocalToolsModal } from '@/components/platform/ConnectLocalToolsModal'
import {
  PageHeader,
  SectionPanel,
  PlatformEmptyState,
  StatusPill,
  PrimaryButton,
  SecondaryButton,
} from '@/lib/design-system/components/platform'
import {
  localToolsLabel,
  localIntelligenceActiveLabel,
  connectorLabel,
  cloudStatusLabel,
} from '@/lib/access/status-labels'
import { listAgents } from '@/lib/actions/agents'
import { useOpenJarvisHealth } from '@/lib/openjarvis/use-openjarvis-health'
import {
  JYSON_CAPABILITY_CARDS,
  resolveJysonCapabilityStatus,
} from '@/lib/openjarvis/jyson-capabilities'
import type { Agent } from '@/types/db'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AgentsPageClient() {
  const searchParams = useSearchParams()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(true)
  const [connectOpen, setConnectOpen] = useState(false)

  const {
    runtime,
    capabilities,
    loading: loadingHealth,
    refresh,
    showSetupCta,
    fileToolsLive,
    localIntelligenceActive,
    connectedBadge,
  } = useOpenJarvisHealth()

  const loading = loadingAgents || loadingHealth

  useEffect(() => {
    listAgents()
      .catch(() => [] as Agent[])
      .then(setAgents)
      .finally(() => setLoadingAgents(false))
  }, [])

  useEffect(() => {
    if (searchParams.get('connect') === 'tools') {
      setConnectOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (typeof window === 'undefined' || window.location.hash !== '#execution') return
    const el = document.getElementById('execution')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [loading])

  const active = agents.filter((a) => a.status === 'active')
  const inactive = agents.filter((a) => a.status !== 'active' && a.status !== 'archived')

  const executionConnected = connectedBadge
  const localToolsPillLabel = fileToolsLive
    ? localToolsLabel(true)
    : localIntelligenceActive
      ? localIntelligenceActiveLabel(true)
      : localToolsLabel(false)

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-shell-page">
        <PageHeader
          title="Agents"
          description="Create specialized AI teammates for different parts of your work."
          actions={
            <>
              {!loading && showSetupCta ? (
                <PrimaryButton type="button" onClick={() => setConnectOpen(true)}>
                  Set up on this Mac
                </PrimaryButton>
              ) : !loading && executionConnected ? (
                <span className="access-ds-badge access-ds-badge--operational" style={{ alignSelf: 'center' }}>
                  {localIntelligenceActiveLabel(true)}
                </span>
              ) : null}
              <PrimaryButton href="/terminal">Register agent</PrimaryButton>
            </>
          }
        />

        {loading ? (
          <div className="access-platform-loading">Loading agents…</div>
        ) : (
          <>
            <SectionPanel title="JYSON" description="Your AI companion — cloud intelligence with optional local connector.">
              <div className="access-agent-card access-agent-card--jyson">
                <div className="access-agent-card__header">
                  <div className="access-agent-card__avatar">◎</div>
                  <div>
                    <p className="access-agent-card__name">JYSON</p>
                    <p className="access-agent-card__role">Your AI companion</p>
                  </div>
                  <StatusPill label="Active" tone="operational" />
                </div>
                <div className="access-agent-capabilities">
                  <div className="access-agent-cap">
                    <span className="access-agent-cap__label">Cloud</span>
                    <StatusPill label={cloudStatusLabel(true)} tone="operational" />
                  </div>
                  <div className="access-agent-cap">
                    <span className="access-agent-cap__label">Connector</span>
                    <StatusPill
                      label={connectorLabel(!!runtime?.connectorOnline)}
                      tone={runtime?.connectorOnline ? 'operational' : 'offline'}
                    />
                  </div>
                  <div className="access-agent-cap">
                    <span className="access-agent-cap__label">Local capabilities</span>
                    <StatusPill
                      label={localToolsPillLabel}
                      tone={executionConnected ? 'operational' : 'offline'}
                    />
                  </div>
                </div>
                {runtime?.message && (
                  <p className="access-platform-meta" style={{ marginTop: 12 }}>
                    {runtime.message}
                  </p>
                )}
              </div>
            </SectionPanel>

            <SectionPanel
              id="execution"
              title="JYSON local capabilities"
              description="Optional intelligence on this Mac — file access, vault depth, and future local layers. Cloud chat works without this."
            >
              <div className="access-agent-card">
                <div className="access-agent-card__header">
                  <div className="access-agent-card__avatar">⚙</div>
                  <div>
                    <p className="access-agent-card__name">Local intelligence</p>
                    <p className="access-agent-card__role">
                      {fileToolsLive
                        ? 'File intelligence is live on this Mac'
                        : localIntelligenceActive
                          ? 'Runtime reachable — finish connector for file intelligence'
                          : 'Enable local capabilities when you develop on this Mac'}
                    </p>
                  </div>
                  <StatusPill
                    label={
                      fileToolsLive
                        ? 'Connected'
                        : localIntelligenceActive
                          ? localIntelligenceActiveLabel(true)
                          : 'Offline'
                    }
                    tone={executionConnected ? 'operational' : 'offline'}
                  />
                </div>
                <div className="access-agent-capabilities">
                  <div className="access-agent-cap">
                    <span className="access-agent-cap__label">Private JYSON</span>
                    <span
                      className={`access-ds-badge access-ds-badge--${
                        runtime?.privateLayerEnabled ? 'operational' : 'neutral'
                      }`}
                    >
                      {runtime?.privateLayerEnabled ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className="access-agent-cap">
                    <span className="access-agent-cap__label">Local runtime</span>
                    <span
                      className={`access-ds-badge access-ds-badge--${
                        runtime?.openJarvisOnline ? 'operational' : 'offline'
                      }`}
                    >
                      {runtime?.openJarvisOnline ? 'Reachable' : 'Down'}
                    </span>
                  </div>
                  <div className="access-agent-cap">
                    <span className="access-agent-cap__label">Install</span>
                    <span
                      className={`access-ds-badge access-ds-badge--${
                        runtime?.openJarvisInstalled ? 'operational' : 'offline'
                      }`}
                    >
                      {runtime?.openJarvisInstalled ? 'Found' : 'Missing'}
                    </span>
                  </div>
                </div>
                <div className="access-jyson-cap-grid" role="list" aria-label="JYSON local capabilities">
                  {JYSON_CAPABILITY_CARDS.map((cap) => {
                    const status = resolveJysonCapabilityStatus(cap.id, runtime, capabilities)
                    return (
                      <article key={cap.id} className="access-jyson-cap-card" role="listitem">
                        <div className="access-jyson-cap-card__head">
                          <p className="access-jyson-cap-card__title">{cap.title}</p>
                          <span className={`access-ds-badge access-ds-badge--${status.tone}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="access-jyson-cap-card__desc">{cap.description}</p>
                      </article>
                    )
                  })}
                </div>
                {showSetupCta ? (
                  <div style={{ marginTop: 12 }}>
                    <p className="access-platform-meta">
                      {runtime?.deploymentMode === 'cloud'
                        ? 'You are on the cloud site. Turn on local capabilities from your Mac when you develop at home.'
                        : runtime?.message ??
                          'Copy one command, run it in Terminal on this Mac, and keep the setup window open — status updates automatically.'}
                    </p>
                    <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <PrimaryButton type="button" onClick={() => setConnectOpen(true)}>
                        Set up on this Mac
                      </PrimaryButton>
                      <SecondaryButton href="/companion#execute">Test in JYSON</SecondaryButton>
                    </div>
                    <p className="access-platform-meta" style={{ marginTop: 8 }}>
                      Advanced install and runtime docs are in{' '}
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>
                        docs/OPENJARVIS_FOUNDER_SETUP.md
                      </span>{' '}
                      (developers only).
                    </p>
                  </div>
                ) : (
                  <p className="access-platform-meta" style={{ marginTop: 12 }}>
                    {fileToolsLive
                      ? 'Local file intelligence is active on this Mac.'
                      : 'Local runtime is reachable. Run connector heartbeat for file intelligence.'}{' '}
                    <Link href="/companion#execute" style={{ color: 'var(--accent)' }}>
                      Test capabilities in JYSON
                    </Link>
                  </p>
                )}
              </div>
            </SectionPanel>

            {agents.length > 0 ? (
              <SectionPanel
                title={`Registered agents (${agents.length})`}
                description="Custom agents you've registered in your workspace."
              >
                <div className="access-offers-grid">
                  {active.map((agent) => (
                    <div key={agent.id} className="access-agent-card">
                      <div className="access-agent-card__header">
                        <div className="access-agent-card__avatar">◉</div>
                        <div>
                          <p className="access-agent-card__name">{agent.name}</p>
                          {agent.role && <p className="access-agent-card__role">{agent.role}</p>}
                        </div>
                        <span className="access-ds-badge access-ds-badge--operational">{agent.status}</span>
                      </div>
                      {agent.description && (
                        <p className="access-agent-card__desc">{agent.description}</p>
                      )}
                      <p className="access-platform-meta" style={{ marginTop: 12 }}>
                        Registered {fmtDate(agent.created_at)}
                      </p>
                    </div>
                  ))}
                  {inactive.map((agent) => (
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
                  actionLabel="Register agent"
                />
              </SectionPanel>
            )}
          </>
        )}
      </div>

      <ConnectLocalToolsModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        runtime={runtime}
        onRuntimeChange={() => void refresh()}
      />
    </AccessAppLayout>
  )
}
