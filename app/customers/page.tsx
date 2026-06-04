'use client'

import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader } from '@/lib/design-system/components/platform'
import Link from 'next/link'

export default function CustomersPage() {
  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-shell-page">
        <PageHeader
          title="Customers"
          description="Clients, prospects, subscribers, partners, and relationships connected to revenue or opportunity."
        />

        {/* Empty state */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(48px, 8vw, 80px) 24px',
          textAlign: 'center',
          maxWidth: 480,
          margin: '0 auto',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            background: 'rgba(64,192,208,0.08)', border: '1px solid rgba(64,192,208,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, marginBottom: 20,
          }}>
            ◉
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            No customers connected yet.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.65, margin: '0 0 8px' }}>
            Customers tracks clients, prospects, subscribers, and relationships connected to your revenue or opportunity pipeline.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 28px' }}>
            Connect Stripe to import subscribers automatically, or ask JYSON to help you define your customer model.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/companion" style={{
              fontSize: 13, fontWeight: 500, color: 'var(--on-accent)',
              background: 'var(--accent)', textDecoration: 'none',
              padding: '8px 16px', borderRadius: 6,
            }}>
              Ask JYSON
            </Link>
            <Link href="/settings/billing" style={{
              fontSize: 13, fontWeight: 500, color: 'var(--text)',
              border: '1px solid var(--border)', textDecoration: 'none',
              padding: '8px 16px', borderRadius: 6,
            }}>
              Connect Stripe
            </Link>
          </div>

          <div style={{ marginTop: 32, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, textAlign: 'left', width: '100%' }}>
            <p style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 10px' }}>Coming in next release</p>
            {[
              'Import from Stripe (subscribers + one-time buyers)',
              'Manual contact/client records',
              'Deal pipeline and opportunity tracking',
              'Revenue per relationship view',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 1 }}>○</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AccessAppLayout>
  )
}
