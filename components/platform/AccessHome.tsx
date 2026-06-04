'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { HomeCommandHero } from '@/lib/design-system/components/platform'
import { useJysonLayerOptional } from '@/components/jyson/JysonLayerProvider'
import type { RegistrySummary } from '@/types/db'

type AccessHomeProps = {
  summary: RegistrySummary | null
  loading: boolean
  identityError: string | null
}

// ── Stat card colors ───────────────────────────────────────────────────────────

const STAT_ACCENT = ['#40C0D0', '#7C6CF8', '#4ABDA0', '#C9A46A', '#4A9EFF', '#E07B52'] as const

// ── Action cards ──────────────────────────────────────────────────────────────

const ACTION_CARDS = [
  { id: 'projects',  label: 'Open projects',        href: '/projects',   desc: 'See what you\'re building and what needs attention.' },
  { id: 'offers',    label: 'Review offers',         href: '/offers',     desc: 'Check your monetization paths and active services.' },
  { id: 'systems',   label: 'Review systems',        href: '/systems',    desc: 'Workflows, automations, and operating infrastructure.' },
  { id: 'jyson',     label: 'Ask Intelligence',      href: '/companion',  desc: 'Ask JYSON what deserves attention next.' },
  { id: 'customers', label: 'Check relationships',   href: '/customers',  desc: 'Clients, leads, and revenue opportunities.' },
  { id: 'billing',   label: 'Manage billing',        href: '/settings/billing', desc: 'Plan, subscription, and payment details.' },
] as const

function getTimeGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function AccessHome({ summary, loading }: AccessHomeProps) {
  const { user } = useUser()
  const layer = useJysonLayerOptional()
  const [plan, setPlan] = useState<string | null>(null)
  const [localConnected, setLocalConnected] = useState<boolean | undefined>(undefined)

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
      .then((d: { connected?: boolean } | null) => { if (d != null) setLocalConnected(!!d.connected) })
      .catch(() => {})
  }, [user])

  const counts = summary?.registryCounts ?? summary?.counts

  const stats = useMemo(() => [
    {
      id: 'projects', label: 'Active projects', href: '/projects',
      value: loading ? '—' : String(counts?.projects ?? 0),
      desc: 'Initiatives in progress',
      color: STAT_ACCENT[0],
    },
    {
      id: 'systems', label: 'Connected systems', href: '/systems',
      value: loading ? '—' : String(counts?.systems ?? 0),
      desc: 'Workflows and automations',
      color: STAT_ACCENT[1],
    },
    {
      id: 'assets', label: 'Registered assets', href: '/assets',
      value: loading ? '—' : String(counts?.assets ?? (counts as Record<string, number> | null | undefined)?.blueprints ?? 0),
      desc: 'IP, frameworks, and resources',
      color: STAT_ACCENT[2],
    },
    {
      id: 'offers', label: 'Monetization paths', href: '/offers',
      value: loading ? '—' : String(counts?.offers ?? 0),
      desc: 'Products and services',
      color: STAT_ACCENT[3],
    },
    {
      id: 'agents', label: 'Team members', href: '/agents',
      value: loading ? '—' : String(counts?.agents ?? 0),
      desc: 'AI agents active',
      color: STAT_ACCENT[4],
    },
    {
      id: 'plan', label: 'Membership', href: '/settings/billing',
      value: loading ? '—' : (plan === 'founder' ? 'Founder' : plan === 'builder' ? 'Builder' : plan === 'operator' ? 'Operator' : 'Free'),
      desc: 'Current plan',
      color: plan === 'founder' ? '#C9A46A' : plan === 'builder' ? '#7C6CF8' : '#40C0D0',
    },
  ], [counts, loading, plan])

  const planLabel = loading ? '—' : (plan === 'founder' ? 'Founder' : plan === 'builder' ? 'Builder' : plan === 'operator' ? 'Operator' : 'Free')
  const planColor = plan === 'founder' ? '#C9A46A' : plan === 'builder' ? '#7C6CF8' : plan === 'operator' ? '#40C0D0' : 'var(--text-muted)'

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      <div style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: 'clamp(24px, 4vh, 36px) clamp(20px, 3vw, 40px) 64px',
      }}>

        {/* Header */}
        <header style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(18px, 2.2vw, 24px)', fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 4px' }}>
                {getTimeGreeting()}, {displayName}.
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                Here is what is active across your workspace.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{
                fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.08em',
                color: planColor, background: `${planColor}18`,
                border: `1px solid ${planColor}40`, padding: '3px 10px',
                borderRadius: 100, textTransform: 'uppercase',
              }}>
                {planLabel}
              </span>
              {localConnected === true && (
                <span style={{
                  fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.08em',
                  color: 'var(--success)', background: 'var(--success-muted)',
                  border: '1px solid rgba(74,189,160,0.2)', padding: '3px 10px', borderRadius: 100,
                }}>
                  Local ●
                </span>
              )}
            </div>
          </div>
        </header>

        {/* JYSON command bar */}
        <div style={{ marginBottom: 24 }}>
          <HomeCommandHero
            variant="stripe"
            hideHeadline
            placeholder="Ask JYSON what to build, fix, write, review, or connect…"
            className="access-home-stripe__command"
          />
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
          {stats.map((s) => (
            <Link key={s.id} href={s.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '14px 16px', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}>
                <p style={{ fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 6px' }}>{s.label}</p>
                <p style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: s.color, margin: '0 0 3px', lineHeight: 1, fontFamily: 'var(--mono)' }}>{s.value}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Two-column layout — single column on mobile */}
        <div className="access-home-two-col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 16, marginBottom: 20 }}>

          {/* Recommended actions */}
          <div>
            <h2 style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 10px' }}>Actions</h2>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {ACTION_CARDS.map((action, i) => (
                <Link key={action.id} href={action.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: i < ACTION_CARDS.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.1s',
                    cursor: 'pointer',
                    gap: 12,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', margin: '0 0 2px' }}>{action.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.desc}</p>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: 16, flexShrink: 0 }}>›</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Status + recent */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h2 style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 10px' }}>Status</h2>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px' }}>
                {[
                  { label: 'Platform',    value: 'Operational',                       color: 'var(--success)' },
                  { label: 'Local tools', value: localConnected === true ? 'Connected' : localConnected === false ? 'Offline' : 'Unknown', color: localConnected === true ? 'var(--success)' : 'var(--text-muted)' },
                  { label: 'Intelligence', value: 'Active',                           color: 'var(--success)' },
                  { label: 'Billing',     value: planLabel !== '—' ? planLabel : '—', color: planColor },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{row.label}</span>
                    <span style={{ fontSize: 12, color: row.color, fontFamily: 'var(--mono)', fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 10px' }}>Recent activity</h2>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, textAlign: 'center' }}>
                  No recent activity yet.
                  <br />
                  <span style={{ fontSize: 11 }}>Actions across projects, offers, and sessions will appear here.</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick nav tiles — Stripe's bottom shortcut pattern */}
        <div>
          <h2 style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 10px' }}>Quick access</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
            {[
              { label: 'Projects', href: '/projects', icon: '▤' },
              { label: 'Systems', href: '/systems', icon: '◇' },
              { label: 'Assets', href: '/assets', icon: '▣' },
              { label: 'Intelligence', href: '/companion', icon: '◎' },
              { label: 'Knowledge', href: '/memory', icon: '◌' },
              { label: 'Team', href: '/agents', icon: '⬡' },
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7,
                  padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'border-color 0.15s',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--accent)' }}>{item.icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
