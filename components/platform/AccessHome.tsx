'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { HomeCommandHero } from '@/lib/design-system/components/platform'
import { buildContextualHome, type AttentionItem } from '@/lib/jyson-layer/contextual-awareness'
import { useJysonLayerOptional } from '@/components/jyson/JysonLayerProvider'
import type { RegistrySummary } from '@/types/db'

type AccessHomeProps = {
  summary: RegistrySummary | null
  loading: boolean
  identityError: string | null
}

function resolveRecommendationAction(
  item: AttentionItem,
  layer: ReturnType<typeof useJysonLayerOptional>,
  router: ReturnType<typeof useRouter>
) {
  if (item.href) {
    router.push(item.href)
    return
  }
  if (item.action && layer) {
    void layer.submit(item.action)
  }
}

const QUICK_ACTIONS = [
  { id: 'projects', label: 'View projects', href: '/projects' },
  { id: 'billing', label: 'Manage billing', href: '/settings/billing' },
  { id: 'memory', label: 'Open memory', href: '/memory' },
  { id: 'local', label: 'Connect local tools', href: '/companion#diagnostics' },
] as const

export default function AccessHome({ summary, loading }: AccessHomeProps) {
  const { user } = useUser()
  const layer = useJysonLayerOptional()
  const router = useRouter()
  const [plan, setPlan] = useState<string | null>(null)
  const [localToolsConnected, setLocalToolsConnected] = useState<boolean | undefined>(undefined)

  const displayName =
    user?.firstName ??
    user?.fullName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ??
    null

  useEffect(() => {
    if (!user) return
    fetch('/api/identity/plan', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { plan?: string } | null) => {
        if (d?.plan) setPlan(d.plan)
      })
      .catch(() => {})
    fetch('/api/jyson/openjarvis/health', { cache: 'no-store' })
      .then((r) => r.json() as Promise<{ runtime?: { localToolsAvailable?: boolean } }>)
      .then((d) => setLocalToolsConnected(!!d.runtime?.localToolsAvailable))
      .catch(() => setLocalToolsConnected(false))
  }, [user])

  const contextual = useMemo(
    () =>
      buildContextualHome({
        displayName,
        summary,
        loading,
        route: {
          pathname: '/dashboard',
          primary: 'home',
          projectId: null,
          companionSection: null,
          settingsSection: null,
        },
        plan,
        localToolsConnected,
      }),
    [displayName, summary, loading, plan, localToolsConnected]
  )

  const metrics = useMemo(() => {
    if (loading) {
      return [
        { id: 'projects', label: 'Projects', value: '—' },
        { id: 'agents', label: 'Agents', value: '—' },
        { id: 'systems', label: 'Systems', value: '—' },
      ]
    }
    const counts = summary?.registryCounts ?? summary?.counts
    return [
      { id: 'projects', label: 'Projects', value: String(counts?.projects ?? 0) },
      { id: 'agents', label: 'Agents', value: String(counts?.agents ?? 0) },
      { id: 'systems', label: 'Systems', value: String(counts?.systems ?? 0) },
    ]
  }, [summary, loading])

  const recommended = useMemo(() => {
    const items = [...contextual.jysonRecommendations, ...contextual.attention]
    return items.slice(0, 3)
  }, [contextual.jysonRecommendations, contextual.attention])

  const statusBits = useMemo(() => {
    if (loading) return []
    const bits: string[] = []
    if (plan) {
      bits.push(plan === 'free' ? 'Free plan' : `${plan} plan`)
    }
    if (localToolsConnected !== undefined) {
      bits.push(localToolsConnected ? 'Local tools connected' : 'Local tools not connected')
    }
    const vaultRow = contextual.workspaceSnapshot.find((r) => r.id === 'vault')
    if (vaultRow) bits.push(vaultRow.value)
    return bits
  }, [loading, plan, localToolsConnected, contextual.workspaceSnapshot])

  return (
    <section className="access-home-stripe" aria-label="Home">
      <div className="access-home-stripe__inner">
        <header className="access-home-stripe__header">
          <h1 className="access-home-stripe__title">{contextual.headline}</h1>
          <p className="access-home-stripe__subtitle">{contextual.focusLine}</p>
        </header>

        <HomeCommandHero
          variant="stripe"
          hideHeadline
          placeholder={contextual.commandPlaceholder}
          className="access-home-stripe__command"
        />

        <div className="access-home-stripe__metrics" role="list" aria-label="Workspace metrics">
          {metrics.map((m) => (
            <div key={m.id} className="access-home-stripe__metric" role="listitem">
              <span className="access-home-stripe__metric-value">{m.value}</span>
              <span className="access-home-stripe__metric-label">{m.label}</span>
            </div>
          ))}
        </div>

        <div className="access-home-stripe__columns">
          <div>
            <h2 className="access-home-stripe__section-label">Continue</h2>
            <div className="access-home-stripe__panel">
              {contextual.continueCard ? (
                <Link
                  href={contextual.continueCard.href!}
                  className="access-home-stripe__continue-link"
                >
                  <span>
                    {contextual.continueCard.title}
                    <span className="access-home-stripe__continue-desc">
                      {contextual.continueCard.description}
                    </span>
                  </span>
                  <span className="access-home-stripe__chevron" aria-hidden>
                    ›
                  </span>
                </Link>
              ) : (
                <p className="access-home-stripe__panel--empty">
                  Open a project or JYSON session — your last place will show here.
                </p>
              )}
            </div>
          </div>

          <div>
            <h2 className="access-home-stripe__section-label">Recommended</h2>
            <div className="access-home-stripe__panel">
              {recommended.length > 0 ? (
                <ul className="access-home-stripe__list">
                  {recommended.map((item) => (
                    <li key={item.id} className="access-home-stripe__list-item">
                      {item.href || item.action ? (
                        <button
                          type="button"
                          className="access-home-stripe__list-button"
                          onClick={() => resolveRecommendationAction(item, layer, router)}
                        >
                          <span>{item.text}</span>
                          {item.action ? (
                            <span className="access-home-stripe__list-action">{item.action}</span>
                          ) : (
                            <span className="access-home-stripe__chevron" aria-hidden>
                              ›
                            </span>
                          )}
                        </button>
                      ) : (
                        <span className="access-home-stripe__list-link" style={{ cursor: 'default' }}>
                          <span>{item.text}</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="access-home-stripe__panel--empty">
                  No recommendations right now. Ask JYSON what to work on next.
                </p>
              )}
            </div>
          </div>
        </div>

        <nav className="access-home-stripe__quick" aria-label="Quick actions">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.id} href={action.href} className="access-home-stripe__quick-link">
              {action.label}
            </Link>
          ))}
        </nav>

        {statusBits.length > 0 ? (
          <div className="access-home-stripe__status" aria-label="Workspace status">
            {statusBits.map((bit) => (
              <span key={bit}>{bit}</span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
