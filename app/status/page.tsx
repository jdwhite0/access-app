import { buildAndPublishStatusBundle } from '@/lib/status-page/build-and-publish'
import { projectConsumerStatus } from '@/lib/status-page/project-audience-view'
import Link from 'next/link'

export const metadata = {
  title: 'System Status — JD AI Systems',
  description: 'Public platform status for JD AI Systems products.',
}

export const revalidate = 30

export default function PublicStatusPage() {
  const bundle = buildAndPublishStatusBundle()
  const status = projectConsumerStatus(bundle)

  const headlineColor = status.operational ? 'var(--success)' : 'var(--gold)'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        fontFamily: 'var(--mono)',
        color: 'var(--text)',
      }}
    >
      <header
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>
          JD AI SYSTEMS
        </span>
        <Link
          href="/"
          style={{ fontSize: '0.65rem', color: 'var(--accent)', textDecoration: 'none', opacity: 0.8 }}
        >
          ACCESS ↗
        </Link>
      </header>

      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px' }}>
        <h1
          style={{
            fontSize: '1.35rem',
            fontWeight: 600,
            color: headlineColor,
            letterSpacing: '0.04em',
            marginBottom: '8px',
          }}
        >
          {status.status}
        </h1>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '40px' }}>
          Updated {new Date(status.updatedAt).toLocaleString()}
        </p>

        <section style={{ marginBottom: '32px' }}>
          <p
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.14em',
              color: 'var(--text-muted)',
              marginBottom: '12px',
            }}
          >
            PRODUCTS
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {status.products.map((p) => (
              <li
                key={p.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.78rem',
                }}
              >
                <span>{p.name}</span>
                <span style={{ color: p.status === 'Operational' ? 'var(--success)' : 'var(--gold)' }}>
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {status.incidents.length > 0 && (
          <section>
            <p
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.14em',
                color: 'var(--text-muted)',
                marginBottom: '12px',
              }}
            >
              ACTIVE NOTICES
            </p>
            {status.incidents.map((inc, i) => (
              <div
                key={i}
                style={{
                  padding: '14px 16px',
                  marginBottom: '8px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  fontSize: '0.74rem',
                  lineHeight: 1.55,
                  color: 'var(--text-dim)',
                }}
              >
                {inc.message}
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
