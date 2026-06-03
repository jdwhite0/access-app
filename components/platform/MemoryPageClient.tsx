'use client'

import { useEffect, useState } from 'react'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel } from '@/lib/design-system/components/platform'
import { fetchJysonCompanionContext } from '@/lib/actions/jyson-companion'
import type { JysonContext } from '@/lib/jyson-bridge/types'

function EntityList({ items, label }: { items: Array<{ id: string; name: string; type?: string }>, label: string }) {
  if (items.length === 0) return <p className="access-platform-meta">No {label.toLowerCase()} registered.</p>
  return (
    <ul className="access-memory-list">
      {items.map(item => (
        <li key={item.id} className="access-memory-list__item">
          <span className="access-memory-list__name">{item.name}</span>
          {item.type && <span className="access-memory-list__type">{item.type}</span>}
        </li>
      ))}
    </ul>
  )
}

export default function MemoryPageClient() {
  const [ctx, setCtx] = useState<JysonContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJysonCompanionContext()
      .then(({ context }) => setCtx(context))
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page">
        <PageHeader
          eyebrow="ACCESS"
          title="Memory"
          description="What JYSON knows about you — your identity, world, and everything it remembers about your context."
        />

        {loading ? (
          <div className="access-platform-loading">Loading your world…</div>
        ) : error ? (
          <div className="access-memory-error">
            <p className="access-platform-body">Could not load your context: {error}</p>
            <p className="access-platform-meta" style={{ marginTop: 8 }}>
              Your Founder OS blueprint needs to be materialized. Go to <a href="/founder" style={{ color: 'var(--accent)' }}>Founder</a> to set it up.
            </p>
          </div>
        ) : !ctx ? (
          <div className="access-memory-error">
            <p className="access-platform-body">Your ACCESS world hasn&apos;t been initialized yet.</p>
            <p className="access-platform-meta" style={{ marginTop: 8 }}>
              Complete your <a href="/founder" style={{ color: 'var(--accent)' }}>Founder blueprint</a> to give JYSON context about you.
            </p>
          </div>
        ) : (
          <>
            {/* Identity summary */}
            <SectionPanel title="Identity">
              <div className="access-settings-info-grid">
                <div className="access-settings-info-row">
                  <span className="access-platform-meta">Handle</span>
                  <span className="access-settings-info-value access-settings-info-value--mono">{ctx.handle}</span>
                </div>
                <div className="access-settings-info-row">
                  <span className="access-platform-meta">Display name</span>
                  <span className="access-settings-info-value">{ctx.identity.displayName}</span>
                </div>
                <div className="access-settings-info-row">
                  <span className="access-platform-meta">Cloud status</span>
                  <span className={`access-ds-badge access-ds-badge--${ctx.companionState.cloudReady ? 'operational' : 'neutral'}`}>
                    {ctx.companionState.cloudReady ? 'Ready' : 'Pending'}
                  </span>
                </div>
                <div className="access-settings-info-row">
                  <span className="access-platform-meta">Local OS</span>
                  <span className={`access-ds-badge access-ds-badge--${ctx.companionState.localConnected ? 'operational' : 'neutral'}`}>
                    {ctx.companionState.localConnected ? 'Connected' : 'Pending'}
                  </span>
                </div>
              </div>
            </SectionPanel>

            {/* JYSON's understanding */}
            {ctx.summary.consumer && (
              <SectionPanel
                title="JYSON's understanding of you"
                description="How JYSON describes your world and context from your Founder blueprint."
              >
                <div className="access-memory-summary">
                  {ctx.summary.consumer.split('\n').filter(Boolean).slice(0, 6).map((line, i) => (
                    <p key={i} className="access-platform-body" style={{ marginBottom: 8 }}>{line}</p>
                  ))}
                </div>
              </SectionPanel>
            )}

            {/* World entities */}
            <SectionPanel title={`Organizations (${ctx.organizations.length})`}>
              <EntityList items={ctx.organizations} label="Organizations" />
            </SectionPanel>

            <SectionPanel title={`Products (${ctx.products.length})`}>
              <EntityList items={ctx.products.map(p => ({ id: p.id, name: p.name, type: p.type }))} label="Products" />
            </SectionPanel>

            <SectionPanel title={`Experiences (${ctx.experiences.length})`}>
              <EntityList items={ctx.experiences.map(e => ({ id: e.id, name: e.name }))} label="Experiences" />
            </SectionPanel>

            {/* Permissions */}
            <SectionPanel title="What JYSON is allowed to do">
              <div className="access-memory-perms">
                <div className="access-memory-perms__col">
                  <p className="access-platform-meta" style={{ marginBottom: 8 }}>Allowed</p>
                  <ul className="access-memory-list access-memory-list--allowed">
                    {ctx.allowedActions.slice(0, 10).map(action => (
                      <li key={action} className="access-memory-list__item">
                        <span className="access-memory-list__check">✓</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="access-memory-perms__col">
                  <p className="access-platform-meta" style={{ marginBottom: 8 }}>Restricted</p>
                  <ul className="access-memory-list access-memory-list--denied">
                    {ctx.deniedActions.slice(0, 6).map(action => (
                      <li key={action} className="access-memory-list__item">
                        <span className="access-memory-list__check access-memory-list__check--denied">✕</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem' }}>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionPanel>
          </>
        )}
      </div>
    </AccessAppLayout>
  )
}
