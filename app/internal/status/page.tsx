import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { buildCommandCenterBundle } from '@/lib/command-center/build-bundle'
import { projectOperatorStatus } from '@/lib/status-page/project-audience-view'
import { StatusBadge } from '@/components/status-page/StatusBadge'
import type { HealthStatus } from '@/lib/platform-health'

export const metadata = {
  title: 'Platform Status — Operator',
  description: 'Operator status inherited from Command Center.',
}

export default async function OperatorStatusPage() {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=internal/status')

  const bundle = buildCommandCenterBundle()
  const status = projectOperatorStatus(bundle)

  const sectionLabel: React.CSSProperties = {
    fontSize: '0.62rem',
    letterSpacing: '0.14em',
    color: 'var(--text-muted)',
    marginBottom: '8px',
    textTransform: 'uppercase',
  }

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '16px 20px',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--mono)' }}>
      <header
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.72rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>JD AI Systems</span>
          <span style={{ color: 'var(--border)' }}>/</span>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Status</span>
          <StatusBadge status={status.overall as HealthStatus} />
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.65rem' }}>
          <Link href="/internal/command-center" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Command Center →
          </Link>
          <Link href="/status" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            Public view
          </Link>
        </div>
      </header>

      <main style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        {status.topAction && (
          <section style={{ marginBottom: '24px' }}>
            <p style={sectionLabel}>Top action (from Command Center)</p>
            <div style={{ ...card, borderLeft: '3px solid var(--gold)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: 0 }}>{status.topAction}</p>
              <Link
                href="/internal/command-center"
                style={{
                  display: 'inline-block',
                  marginTop: '12px',
                  fontSize: '0.65rem',
                  color: 'var(--accent)',
                }}
              >
                View all recommendations →
              </Link>
            </div>
          </section>
        )}

        <section style={{ marginBottom: '24px' }}>
          <p style={sectionLabel}>Products</p>
          <div style={card}>
            {status.products.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.74rem',
                }}
              >
                <span style={{ color: 'var(--text-dim)' }}>{p.name}</span>
                <span style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <StatusBadge status={p.status as HealthStatus} />
                  {p.openIncidents > 0 && (
                    <span style={{ color: '#E07B39', fontSize: '0.65rem' }}>{p.openIncidents} open</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        {status.incidents.length > 0 && (
          <section>
            <p style={sectionLabel}>Open incidents</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {status.incidents.map((inc) => (
                <div key={inc.id} style={{ ...card, fontSize: '0.72rem', lineHeight: 1.5 }}>
                  <div style={{ color: 'var(--accent)', opacity: 0.7, marginBottom: '6px' }}>
                    {inc.kind} · {inc.product}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>{inc.message}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer style={{ marginTop: '32px', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
          Snapshot {new Date(status.updatedAt).toLocaleString()} · inherits Command Center bundle
        </footer>
      </main>
    </div>
  )
}
