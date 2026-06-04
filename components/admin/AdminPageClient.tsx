'use client'

import Link from 'next/link'
import type { AdminUserRow, AdminStats } from '@/lib/admin/get-all-users'

const PLAN_COLOR: Record<string, string> = {
  founder: 'var(--gold)',
  builder: '#7C6CF8',
  operator: '#4A9EFF',
  free: 'var(--text-muted)',
  suspended: 'var(--error)',
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '16px 18px',
      flex: 1,
      minWidth: 120,
    }}>
      <p style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color: color ?? 'var(--text)', margin: '6px 0 2px', letterSpacing: '-0.02em', fontFamily: 'var(--mono)' }}>{value}</p>
      {sub ? <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{sub}</p> : null}
    </div>
  )
}

export default function AdminPageClient({ users, stats }: { users: AdminUserRow[]; stats: AdminStats }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Overview</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{stats.total} accounts · {stats.paid} paid · ${stats.mrr_estimate.toLocaleString()} MRR estimate</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="Total accounts" value={String(stats.total)} />
        <StatCard label="Paid" value={String(stats.paid)} sub="Builder + Operator" color="#7C6CF8" />
        <StatCard label="Free tier" value={String(stats.free)} />
        <StatCard label="Founder" value={String(stats.founder)} color="var(--gold)" />
        <StatCard label="MRR estimate" value={`$${stats.mrr_estimate.toLocaleString()}`} sub="Active paid plans" color="var(--success)" />
      </div>

      {/* User table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>All accounts</h2>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>{users.length} total</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--mono)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Handle', 'Plan', 'Stripe', 'JYSON/mo', 'Registry', 'Joined', 'Actions'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 14px', fontSize: 10,
                    letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 400, textTransform: 'uppercase', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 14px', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                    {u.handle ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.08em',
                      color: PLAN_COLOR[u.plan] ?? 'var(--text-muted)',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${PLAN_COLOR[u.plan] ?? 'var(--border)'}`,
                      borderRadius: 3, padding: '2px 7px',
                    }}>
                      {u.plan.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: u.stripe_customer_id ? 'var(--success)' : 'var(--text-muted)' }}>
                    {u.stripe_customer_id ? '✓' : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-dim)' }}>{u.jyson_messages_mo}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-dim)' }}>{u.registry_objects_total}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(u.created_at)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <Link href={`/admin/users/${u.id}`} style={{
                      fontSize: 11, color: 'var(--accent)', textDecoration: 'none',
                      padding: '3px 10px', border: '1px solid rgba(64,192,208,0.25)',
                      borderRadius: 4, whiteSpace: 'nowrap',
                    }}>
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 14px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No accounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
