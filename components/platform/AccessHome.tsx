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
  if (item.href) { router.push(item.href); return }
  if (item.action && layer) void layer.submit(item.action)
}

const QUICK_ACTIONS = [
  { id: 'projects', label: 'Projects', href: '/projects', icon: '⬧' },
  { id: 'registry', label: 'Registry', href: '/registry', icon: '◈' },
  { id: 'memory', label: 'Memory', href: '/memory', icon: '◉' },
  { id: 'agents', label: 'Agents', href: '/agents', icon: '⬡' },
  { id: 'vaults', label: 'Vaults', href: '/vaults', icon: '▣' },
  { id: 'billing', label: 'Billing', href: '/settings/billing', icon: '◎' },
] as const

const STAT_COLORS = ['#40C0D0', '#7C6CF8', '#C9A46A', '#4ABDA0']

export default function AccessHome({ summary, loading }: AccessHomeProps) {
  const { user } = useUser()
  const layer = useJysonLayerOptional()
  const router = useRouter()
  const [plan, setPlan] = useState<string | null>(null)
  const [localToolsConnected, setLocalToolsConnected] = useState<boolean | undefined>(undefined)

  const displayName =
    user?.firstName ??
    user?.fullName?.split(' ')[0] ??
    user?.username ??
    'Builder'

  useEffect(() => {
    if (!user) return
    fetch('/api/identity/plan', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { plan?: string } | null) => { if (d?.plan) setPlan(d.plan) })
      .catch(() => {})
    fetch('/api/connector/status', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { connected?: boolean } | null) => {
        if (d != null) setLocalToolsConnected(d.connected ?? false)
      })
      .catch(() => {})
  }, [user])

  const contextual = useMemo(
    () => buildContextualHome({ displayName, summary, loading: loading ?? false, plan, route: { pathname: '/dashboard', primary: 'home', projectId: null, companionSection: null, settingsSection: null } }),
    [displayName, summary, loading, plan]
  )

  const counts = summary?.registryCounts ?? summary?.counts

  const stats = useMemo(() => {
    const c = loading ? null : counts
    return [
      { id: 'projects', label: 'Projects', value: c ? String(c.projects ?? 0) : '—', href: '/projects' },
      { id: 'systems', label: 'Systems', value: c ? String(c.systems ?? 0) : '—', href: '/systems' },
      { id: 'agents', label: 'Agents', value: c ? String(c.agents ?? 0) : '—', href: '/agents' },
      { id: 'plan', label: 'Plan', value: loading ? '—' : (plan === 'founder' ? 'Founder' : plan === 'builder' ? 'Builder' : plan === 'operator' ? 'Operator' : 'Free'), href: '/settings/billing' },
    ]
  }, [counts, loading, plan])

  const recommended = useMemo(() => {
    const items = [...contextual.jysonRecommendations, ...contextual.attention]
    return items.slice(0, 4)
  }, [contextual.jysonRecommendations, contextual.attention])

  const planLabel = loading ? '—' : (plan === 'founder' ? 'Founder' : plan === 'builder' ? 'Builder' : plan === 'operator' ? 'Operator' : 'Free')
  const planColor = plan === 'founder' ? '#C9A46A' : plan === 'builder' ? '#7C6CF8' : plan === 'operator' ? '#40C0D0' : 'var(--text-muted)'

  return (
    <section style={{ minHeight: '100%', background: 'var(--bg)', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(28px, 4vh, 44px) clamp(20px, 3vw, 40px) 64px' }}>

        {/* Header */}
        <header style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 'clamp(20px, 2.5vw, 26px)', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--text)', margin: 0 }}>
              Good {getTimeGreeting()}, {displayName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: planColor, background: `${planColor}18`, border: `1px solid ${planColor}40`, padding: '3px 10px', borderRadius: 100, textTransform: 'uppercase' }}>
                {planLabel}
              </span>
              {localToolsConnected === true && (
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.08em', color: 'var(--success)', background: 'var(--success-muted)', border: '1px solid rgba(74,189,160,0.2)', padding: '3px 10px', borderRadius: 100 }}>
                  Local ●
                </span>
              )}
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{contextual.focusLine}</p>
        </header>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
          {stats.map((s, i) => (
            <Link key={s.id} href={s.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase' }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: STAT_COLORS[i] ?? 'var(--text)', margin: 0, lineHeight: 1 }}>{s.value}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* JYSON command */}
        <div style={{ marginBottom: 28 }}>
          <HomeCommandHero
            variant="stripe"
            hideHeadline
            placeholder={contextual.commandPlaceholder}
            className="access-home-stripe__command"
          />
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 28 }}>

          {/* Recommended / attention */}
          <div>
            <h2 style={{ fontSize: 12, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 12px' }}>Recommended</h2>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              {recommended.length > 0 ? recommended.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => resolveRecommendationAction(item, layer, router)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderBottom: i < recommended.length - 1 ? '1px solid var(--border)' : 'none',
                    background: 'transparent',
                    border: 'none',
                    borderBottomColor: i < recommended.length - 1 ? 'var(--border)' : 'transparent',
                    borderBottomStyle: 'solid',
                    borderBottomWidth: i < recommended.length - 1 ? 1 : 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                    gap: 12,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 14, color: 'var(--text)', margin: 0, lineHeight: 1.4 }}>{item.text}</p>
                    {item.action && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0', fontFamily: 'var(--mono)' }}>{item.action}</p>}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 18, flexShrink: 0 }}>›</span>
                </button>
              )) : (
                <div style={{ padding: '24px 18px' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                    You&apos;re all caught up. Ask JYSON what to work on next.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Continue card + quick links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 12, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 12px' }}>Continue</h2>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 18 }}>
                {contextual.continueCard ? (
                  <Link href={contextual.continueCard.href!} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', margin: 0 }}>{contextual.continueCard.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{contextual.continueCard.description}</p>
                    </div>
                    <span style={{ color: 'var(--accent)', fontSize: 18, flexShrink: 0 }}>›</span>
                  </Link>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    Open a project or session — it will appear here.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 12, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 12px' }}>Status</h2>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Platform', value: 'Operational', color: 'var(--success)' },
                  { label: 'Local tools', value: localToolsConnected === true ? 'Connected' : localToolsConnected === false ? 'Offline' : '—', color: localToolsConnected === true ? 'var(--success)' : 'var(--text-muted)' },
                  { label: 'JYSON', value: 'Active', color: 'var(--success)' },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: row.color, fontFamily: 'var(--mono)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 style={{ fontSize: 12, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 12px' }}>Quick access</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.id} href={action.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.15s' }}>
                  <span style={{ fontSize: 14, color: 'var(--accent)' }}>{action.icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

function getTimeGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
