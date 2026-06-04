export const metadata = { title: 'Coupons — Admin' }

const COUPONS = [
  { id: 'FOUNDER50', name: 'Founder Launch', discount: '50% off', duration: 'First cycle only', audience: 'Public — surfaced on plans page', status: 'active' },
  { id: 'PARTNER20', name: 'Partner', discount: '20% off', duration: 'Forever', audience: 'Admin only — apply manually per account', status: 'active' },
  { id: 'ANNUAL25', name: 'Annual Commitment', discount: '25% off', duration: 'Forever', audience: 'Admin only — apply to annual upgrades', status: 'active' },
  { id: 'LEGACY100', name: 'Legacy Access', discount: '100% off', duration: 'Forever', audience: 'Admin only — lifetime comp accounts', status: 'active' },
]

export default function AdminCouponsPage() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Coupons</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Apply coupons to individual accounts from the Users → account detail page.</p>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--mono)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Code', 'Name', 'Discount', 'Duration', 'Audience', 'Status'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '9px 14px', fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 400, textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COUPONS.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '11px 14px', color: 'var(--accent)', fontWeight: 600 }}>{c.id}</td>
                <td style={{ padding: '11px 14px', color: 'var(--text)' }}>{c.name}</td>
                <td style={{ padding: '11px 14px', color: 'var(--success)', fontWeight: 600 }}>{c.discount}</td>
                <td style={{ padding: '11px 14px', color: 'var(--text-dim)' }}>{c.duration}</td>
                <td style={{ padding: '11px 14px', color: 'var(--text-muted)', maxWidth: 260 }}>{c.audience}</td>
                <td style={{ padding: '11px 14px' }}>
                  <span style={{ fontSize: 10, color: 'var(--success)', background: 'rgba(74,189,160,0.08)', border: '1px solid rgba(74,189,160,0.2)', borderRadius: 3, padding: '2px 7px' }}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(201,164,106,0.06)', border: '1px solid rgba(201,164,106,0.2)', borderRadius: 7, fontSize: 12, color: 'var(--gold)', fontFamily: 'var(--mono)' }}>
        Coupons created in Stripe test mode. To use on live subscriptions, recreate in Stripe Dashboard → Products → Coupons using the same IDs.
      </div>
    </div>
  )
}
