'use client'

import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel } from '@/lib/design-system/components/platform'
import type { AdminUserRow, AdminStats } from '@/lib/admin/get-all-users'

const PLAN_COLOR: Record<string, string> = {
  founder: 'var(--gold)',
  builder: '#7C6CF8',
  operator: '#4A9EFF',
  free: 'var(--text-muted)',
}

const PLAN_LABEL: Record<string, string> = {
  founder: 'FOUNDER',
  builder: 'BUILDER',
  operator: 'OPERATOR',
  free: 'FREE',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span style={{
      fontSize: '0.62rem',
      fontFamily: 'var(--mono)',
      letterSpacing: '0.1em',
      color: PLAN_COLOR[plan] ?? 'var(--text-muted)',
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${PLAN_COLOR[plan] ?? 'var(--border)'}`,
      borderRadius: 4,
      padding: '2px 7px',
    }}>
      {PLAN_LABEL[plan] ?? plan.toUpperCase()}
    </span>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      minWidth: 120,
      flex: 1,
    }}>
      <p style={{ fontSize: '0.62rem', fontFamily: 'var(--mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{label}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
      {sub ? <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{sub}</p> : null}
    </div>
  )
}

type Props = {
  users: AdminUserRow[]
  stats: AdminStats
}

export default function AdminPageClient({ users, stats }: Props) {
  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-shell-page access-shell-page--wide">
        <PageHeader
          title="Admin"
          description={`${stats.total} users · ${stats.paid} paid · $${stats.mrr_estimate.toLocaleString()} MRR estimate`}
        />

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <StatCard label="Total users" value={String(stats.total)} />
          <StatCard label="Paid" value={String(stats.paid)} sub={`Builder + Operator`} />
          <StatCard label="Free" value={String(stats.free)} />
          <StatCard label="Founder" value={String(stats.founder)} />
          <StatCard label="MRR estimate" value={`$${stats.mrr_estimate.toLocaleString()}`} sub="Based on active plans" />
        </div>

        {/* User table */}
        <SectionPanel title="All users">
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.82rem',
              fontFamily: 'var(--mono)',
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Handle', 'Plan', 'Stripe', 'JYSON (mo)', 'Registry', 'Joined'].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: '0.62rem',
                      letterSpacing: '0.1em',
                      color: 'var(--text-muted)',
                      fontWeight: 400,
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {u.handle ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <PlanBadge plan={u.plan} />
                    </td>
                    <td style={{ padding: '10px 12px', color: u.stripe_customer_id ? 'var(--success)' : 'var(--text-muted)' }}>
                      {u.stripe_customer_id ? '✓' : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {u.jyson_messages_mo}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {u.registry_objects_total}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(u.created_at)}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '24px 12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionPanel>
      </div>
    </AccessAppLayout>
  )
}
