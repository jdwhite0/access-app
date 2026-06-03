import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getFounderBlueprint } from '@/lib/actions/founder-blueprint'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'

export const metadata = {
  title: 'Founder OS — ACCESS',
  description: 'Your Founder OS overview.',
}

export default async function FounderOverviewPage() {
  const { userId } = await auth()
  if (!userId) redirect('/')

  const blueprint = await getFounderBlueprint()
  if (!blueprint?.spec) redirect('/founder')

  const spec = blueprint.spec
  const handle = spec.founder.access_handle
  const displayName = spec.founder.display_name

  return (
    <div className="relative h-full scanline">
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(64,192,208,1) 1px, transparent 1px), linear-gradient(90deg, rgba(64,192,208,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <AccessAppLayout variant="founder" userLabel={handle}>
        <div className="founder-overview">
          <header className="founder-overview-header">
            <p className="founder-wizard-eyebrow">Founder OS</p>
            <h1 className="founder-overview-title">{displayName}</h1>
            <p className="founder-overview-handle">{handle}</p>
            <span className={`founder-overview-status founder-overview-status--${spec.status}`}>
              {spec.status}
            </span>
          </header>

          <div className="founder-overview-grid">
            <div className="founder-overview-card">
              <p className="founder-overview-card-label">Organizations</p>
              <p className="founder-overview-card-count">{spec.organizations.length}</p>
              {spec.organizations.length === 0 ? (
                <p className="founder-overview-card-empty">None added yet</p>
              ) : (
                <ul className="founder-overview-list">
                  {spec.organizations.map((o) => (
                    <li key={o.id}>{o.name}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="founder-overview-card">
              <p className="founder-overview-card-label">Products</p>
              <p className="founder-overview-card-count">{spec.products.length}</p>
              {spec.products.length === 0 ? (
                <p className="founder-overview-card-empty">None added yet</p>
              ) : (
                <ul className="founder-overview-list">
                  {spec.products.map((p) => (
                    <li key={p.id}>{p.name} <span className="founder-overview-type">{p.type}</span></li>
                  ))}
                </ul>
              )}
            </div>

            <div className="founder-overview-card">
              <p className="founder-overview-card-label">Experiences</p>
              <p className="founder-overview-card-count">{spec.experiences.length}</p>
              {spec.experiences.length === 0 ? (
                <p className="founder-overview-card-empty">None added yet</p>
              ) : (
                <ul className="founder-overview-list">
                  {spec.experiences.map((e) => (
                    <li key={e.id}>
                      {e.name}
                      {e.url && <span className="founder-overview-url"> · {e.url}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="founder-overview-actions">
            <Link href="/companion" className="auth-primary-btn">
              Open JYSON Companion →
            </Link>
            <Link href="/terminal" className="founder-wizard-btn-secondary">
              Open Terminal
            </Link>
            <button
              type="button"
              className="founder-wizard-btn-secondary"
              disabled
              title="Coming soon"
            >
              Create New Blueprint <span className="founder-overview-soon">Coming soon</span>
            </button>
          </div>

          <div className="founder-overview-meta">
            <p className="founder-wizard-muted">
              Founder OS ID: <code>{spec.output.founder_os_id}</code>
            </p>
            {spec.exported_at && (
              <p className="founder-wizard-muted">
                Generated: {new Date(spec.exported_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </AccessAppLayout>
    </div>
  )
}
