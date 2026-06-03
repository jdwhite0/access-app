import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getFounderBlueprint } from '@/lib/actions/founder-blueprint'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import {
  PageHeader,
  BlueprintHealthCard,
  RecommendationCard,
  SectionPanel,
} from '@/lib/design-system/components/platform'

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
  const statusVariant =
    spec.status === 'materialized' || spec.status === 'exported'
      ? 'operational'
      : spec.status === 'draft'
        ? 'degraded'
        : 'offline'

  return (
    <AccessAppLayout variant="founder" userLabel={handle}>
      <div className="access-platform access-platform-page access-platform-page--wide">
        <PageHeader
          eyebrow="Founder OS"
          title={displayName}
          description={`${handle} · Blueprint ${spec.status}`}
        />

        <div className="access-platform-grid access-platform-grid--2" style={{ marginTop: 24 }}>
          <BlueprintHealthCard
            status={statusVariant}
            statusLabel={spec.status}
            summary="Your Founder blueprint materializes identity, ventures, and the package JYSON loads from the cloud."
            items={[
              { label: 'Organizations', value: String(spec.organizations.length) },
              { label: 'Products', value: String(spec.products.length) },
              { label: 'Experiences', value: String(spec.experiences.length) },
            ]}
            href="/founder"
            hrefLabel="Edit blueprint"
          />
          <RecommendationCard
            title="Open JYSON Companion"
            description="Run commands, explore local files when connected, and get structured strategic answers."
            href="/companion"
            meta="Primary intelligence"
            priority="high"
          />
        </div>

        <SectionPanel title="Catalog" description="Organizations, products, and experiences in your blueprint.">
          <div className="access-platform-grid access-platform-grid--3">
            <div className="access-platform-card">
              <p className="access-platform-meta">Organizations</p>
              <p className="access-platform-metric-card__value">{spec.organizations.length}</p>
              {spec.organizations.length === 0 ? (
                <p className="access-platform-body">None added yet</p>
              ) : (
                <ul className="access-platform-body" style={{ marginTop: 10, paddingLeft: 18 }}>
                  {spec.organizations.map((o) => (
                    <li key={o.id}>{o.name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="access-platform-card">
              <p className="access-platform-meta">Products</p>
              <p className="access-platform-metric-card__value">{spec.products.length}</p>
              {spec.products.length === 0 ? (
                <p className="access-platform-body">None added yet</p>
              ) : (
                <ul className="access-platform-body" style={{ marginTop: 10, paddingLeft: 18 }}>
                  {spec.products.map((p) => (
                    <li key={p.id}>
                      {p.name} <span className="access-platform-meta">({p.type})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="access-platform-card">
              <p className="access-platform-meta">Experiences</p>
              <p className="access-platform-metric-card__value">{spec.experiences.length}</p>
              {spec.experiences.length === 0 ? (
                <p className="access-platform-body">None added yet</p>
              ) : (
                <ul className="access-platform-body" style={{ marginTop: 10, paddingLeft: 18 }}>
                  {spec.experiences.map((e) => (
                    <li key={e.id}>
                      {e.name}
                      {e.url ? (
                        <span className="access-platform-meta"> · {e.url}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </SectionPanel>

        <div className="access-platform-grid access-platform-grid--2" style={{ marginTop: 24 }}>
          <Link href="/companion" className="access-platform-link">
            Open JYSON Companion →
          </Link>
          <Link href="/terminal" className="access-platform-link">
            Open Terminal →
          </Link>
        </div>

        <div className="access-platform-card" style={{ marginTop: 24 }}>
          <p className="access-platform-meta">Founder OS ID</p>
          <p className="access-platform-body" style={{ fontFamily: 'var(--font-mono)', marginTop: 6 }}>
            {spec.output.founder_os_id}
          </p>
          {spec.exported_at ? (
            <p className="access-platform-meta" style={{ marginTop: 8 }}>
              Generated {new Date(spec.exported_at).toLocaleString()}
            </p>
          ) : null}
        </div>
      </div>
    </AccessAppLayout>
  )
}
