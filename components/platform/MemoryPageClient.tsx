'use client'

import { useEffect, useState } from 'react'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import {
  PageHeader,
  SectionPanel,
  StatusPill,
  SecondaryButton,
} from '@/lib/design-system/components/platform'
import { cloudStatusLabel, localSyncLabel } from '@/lib/access/status-labels'
import { useJysonLayerOptional } from '@/components/jyson/JysonLayerProvider'
import { fetchJysonCompanionContext } from '@/lib/actions/jyson-companion'
import type { JysonContext } from '@/lib/jyson-bridge/types'

function EntityList({ items, label }: { items: Array<{ id: string; name: string; type?: string }>, label: string }) {
  if (items.length === 0) return <p className="access-platform-meta">No {label.toLowerCase()} registered.</p>
  return (
    <ul className="access-memory-list access-shell-panel">
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
  const layer = useJysonLayerOptional()
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
      <div className="access-platform access-platform-page access-shell-page">
        <PageHeader
          title="Memory"
          description="What JYSON knows, remembers, and uses to help you."
          secondary={
            layer ? (
              <SecondaryButton type="button" onClick={() => void layer.submit('What do you remember about me?')}>
                Ask JYSON what you remember
              </SecondaryButton>
            ) : undefined
          }
        />

        {loading ? (
          <div className="access-platform-loading">Loading memory…</div>
        ) : error ? (
          <div className="access-memory-error">
            <p className="access-platform-body">Could not load your context: {error}</p>
            <p className="access-platform-meta" style={{ marginTop: 8 }}>
              Complete your <a href="/founder" style={{ color: 'var(--accent)' }}>Founder blueprint</a> so Memory has context to load.
            </p>
          </div>
        ) : !ctx ? (
          <div className="access-memory-error">
            <p className="access-platform-body">Your workspace context isn&apos;t set up yet.</p>
            <p className="access-platform-meta" style={{ marginTop: 8 }}>
              Complete your <a href="/founder" style={{ color: 'var(--accent)' }}>Founder blueprint</a> so JYSON knows who you are and what you build.
            </p>
          </div>
        ) : (
          <>
            {/* Identity summary */}
            <SectionPanel title="Recent context" description="From your loaded Founder blueprint package.">
              {ctx.summary.consumer ? (
                <div className="access-memory-summary">
                  {ctx.summary.consumer.split('\n').filter(Boolean).slice(0, 4).map((line, i) => (
                    <p key={i} className="access-platform-body" style={{ marginBottom: 8 }}>{line}</p>
                  ))}
                </div>
              ) : (
                <p className="access-platform-meta">No summary text in blueprint yet.</p>
              )}
            </SectionPanel>

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
                  <StatusPill
                    label={cloudStatusLabel(ctx.companionState.cloudReady)}
                    tone={ctx.companionState.cloudReady ? 'operational' : 'neutral'}
                  />
                </div>
                <div className="access-settings-info-row">
                  <span className="access-platform-meta">Local tools</span>
                  <StatusPill
                    label={localSyncLabel(ctx.companionState.localConnected)}
                    tone={ctx.companionState.localConnected ? 'operational' : 'neutral'}
                  />
                </div>
              </div>
            </SectionPanel>

            <SectionPanel title={`Organizations (${ctx.organizations.length})`} description="Saved knowledge from your blueprint.">
              <EntityList items={ctx.organizations} label="Organizations" />
            </SectionPanel>

            <SectionPanel title={`Products (${ctx.products.length})`}>
              <EntityList items={ctx.products.map(p => ({ id: p.id, name: p.name, type: p.type }))} label="Products" />
            </SectionPanel>

            <SectionPanel title={`Experiences (${ctx.experiences.length})`}>
              <EntityList items={ctx.experiences.map(e => ({ id: e.id, name: e.name }))} label="Experiences" />
            </SectionPanel>

            <SectionPanel title="Local file context" description="Available when OpenJarvis and the connector are connected.">
              <p className="access-platform-meta">
                {ctx.companionState.localConnected
                  ? 'Local tools are connected — JYSON can read files and vault notes on this machine.'
                  : 'Local tools not connected. Open diagnostics in JYSON to connect.'}
              </p>
            </SectionPanel>

            <SectionPanel title="Conversation insights" description="Recent intents appear on Home when you ask JYSON.">
              <p className="access-platform-meta">
                Use the JYSON orb on any page to continue threads — nothing is stored here as a separate feed yet.
              </p>
            </SectionPanel>

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
