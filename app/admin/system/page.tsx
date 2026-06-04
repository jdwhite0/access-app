import { getSystemStatus } from '@/lib/admin/actions'
import Link from 'next/link'

export const metadata = { title: 'System — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminSystemPage() {
  const status = await getSystemStatus()

  const ENV_KEYS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'STRIPE_PRICE_OPERATOR_MONTHLY',
    'STRIPE_PRICE_BUILDER_MONTHLY',
    'STRIPE_PRICE_OPERATOR_ANNUAL',
    'STRIPE_PRICE_BUILDER_ANNUAL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_APP_URL',
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>System</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Platform health and configuration overview.</p>
      </div>

      {/* Health */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>Platform health</h2>
        </div>
        <div style={{ padding: '16px' }}>
          {[
            { label: 'Supabase', ok: status.supabaseOk, detail: status.supabaseOk ? 'Connected' : 'Unreachable' },
            { label: 'Stripe', ok: status.stripeOk, detail: status.stripeOk ? 'Connected' : 'Unreachable or unconfigured' },
            { label: 'Platform', ok: true, detail: 'Operational' },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.ok ? 'var(--success)' : 'var(--error)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text)', width: 120 }}>{row.label}</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: row.ok ? 'var(--success)' : 'var(--error)' }}>{row.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total accounts', value: String(status.userCount) },
          { label: 'Paid accounts', value: String(status.paidCount) },
          { label: 'MRR estimate', value: `$${status.mrrEstimate.toLocaleString()}` },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
            <p style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: 'var(--mono)', letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Env check */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>Environment variables</h2>
        </div>
        <div style={{ padding: '8px 16px' }}>
          {ENV_KEYS.map((key) => {
            const set = !!process.env[key]
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: set ? 'var(--success)' : 'var(--error)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: set ? 'var(--text-dim)' : 'var(--error)', flex: 1 }}>{key}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: set ? 'var(--success)' : 'var(--text-muted)' }}>{set ? 'set' : 'missing'}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
        <Link href="/internal/command-center" style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--accent)', textDecoration: 'none', padding: '8px 14px', border: '1px solid rgba(64,192,208,0.25)', borderRadius: 5 }}>
          Open command center →
        </Link>
        <Link href="/internal/status" style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-muted)', textDecoration: 'none', padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 5 }}>
          Platform status →
        </Link>
      </div>
    </div>
  )
}
