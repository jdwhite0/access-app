import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PRODUCT_REGISTRY } from '@/lib/platform-health'
import type { HealthStatus, HealthEventSeverity } from '@/lib/platform-health'
import type { RecommendationPriority } from '@/lib/command-center/recommendations'
import { buildAndPublishStatusBundle } from '@/lib/status-page/build-and-publish'
import DashboardRefresher from '@/components/command-center/DashboardRefresher'

export const metadata = {
  title: 'Command Center — JD AI Systems',
  description: 'Operator platform health dashboard.',
}

// ─── Status display helpers ──────────────────────────────────────────────────

const STATUS_COLOR: Record<HealthStatus, string> = {
  operational:   'var(--success)',
  degraded:      'var(--gold)',
  partial_outage: '#E07B39',
  blocked:       '#E05252',
  offline:       '#880000',
  unknown:       'var(--text-muted)',
}

const STATUS_LABEL: Record<HealthStatus, string> = {
  operational:   'OPERATIONAL',
  degraded:      'DEGRADED',
  partial_outage: 'PARTIAL OUTAGE',
  blocked:       'BLOCKED',
  offline:       'OFFLINE',
  unknown:       'UNKNOWN',
}

const PRIORITY_COLOR: Record<RecommendationPriority, string> = {
  critical: '#E05252',
  high:     '#E07B39',
  medium:   'var(--gold)',
  low:      'var(--text-muted)',
}

const SEVERITY_COLOR: Record<HealthEventSeverity, string> = {
  critical: '#E05252',
  error:    '#E07B39',
  warning:  'var(--gold)',
  info:     'var(--text-muted)',
}

function StatusBadge({ status }: { status: HealthStatus }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: '0.62rem',
        letterSpacing: '0.1em',
        fontFamily: 'var(--mono)',
        border: `1px solid ${STATUS_COLOR[status]}`,
        color: STATUS_COLOR[status],
        borderRadius: '2px',
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: RecommendationPriority }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: '0.62rem',
        letterSpacing: '0.1em',
        fontFamily: 'var(--mono)',
        border: `1px solid ${PRIORITY_COLOR[priority]}`,
        color: PRIORITY_COLOR[priority],
        borderRadius: '2px',
        whiteSpace: 'nowrap',
        minWidth: '72px',
        textAlign: 'center',
      }}
    >
      {priority.toUpperCase()}
    </span>
  )
}

const cell: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--border)',
  fontSize: '0.73rem',
  color: 'var(--text-dim)',
  fontFamily: 'var(--mono)',
  verticalAlign: 'top',
}

const headCell: React.CSSProperties = {
  ...cell,
  color: 'var(--text-muted)',
  fontSize: '0.62rem',
  letterSpacing: '0.1em',
  borderBottom: '1px solid rgba(255,255,255,0.12)',
  fontWeight: 600,
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function CommandCenterPage() {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=command-center')

  const bundle = buildAndPublishStatusBundle()
  const { snapshot, events, recommendations, products, providers, incidents, overview } =
    bundle
  const generatedAt = bundle.generatedAt

  // ── Layout ────────────────────────────────────────────────────────────────

  const sectionLabel: React.CSSProperties = {
    fontSize: '0.62rem',
    letterSpacing: '0.14em',
    color: 'var(--text-muted)',
    fontFamily: 'var(--mono)',
    marginBottom: '8px',
    textTransform: 'uppercase',
  }

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    padding: '16px 20px',
  }

  const table: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.73rem',
    fontFamily: 'var(--mono)',
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: 'var(--bg)',
        fontFamily: 'var(--mono)',
      }}
      id="terminal-scroll"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <StatusBadge status={snapshot.overall} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/internal/status"
            style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            Status
          </Link>
          <Link
            href="/status"
            style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            Public
          </Link>
          <DashboardRefresher intervalMs={30000} />
        </div>
      </div>

      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* ── Overview cards ─────────────────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <p style={sectionLabel}>Platform Overview</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {[
              { label: 'OVERALL',          value: STATUS_LABEL[snapshot.overall], color: STATUS_COLOR[snapshot.overall] },
              { label: 'PRODUCTS',         value: String(Object.keys(PRODUCT_REGISTRY).length), color: 'var(--accent)' },
              { label: 'OPEN INCIDENTS',   value: String(overview.openIncidents),           color: overview.openIncidents > 0 ? '#E07B39' : 'var(--success)' },
              { label: 'AFFECTED PRODUCTS',value: String(overview.affectedProducts),color: overview.affectedProducts > 0 ? 'var(--gold)' : 'var(--success)' },
              { label: 'AFFECTED PROVIDERS',value: String(overview.affectedProviders),color: overview.affectedProviders > 0 ? 'var(--gold)' : 'var(--success)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ ...card, textAlign: 'center' }}>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '8px' }}>
                  {label}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color, letterSpacing: '0.04em' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Products table ──────────────────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <p style={sectionLabel}>Products</p>
          <div style={card}>
            <table style={table}>
              <thead>
                <tr>
                  {['Product ID', 'Display Name', 'Status', 'Open Incidents'].map((h) => (
                    <th key={h} style={{ ...headCell, textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ background: p.openIncidents > 0 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                    <td style={{ ...cell, color: 'var(--accent)', opacity: 0.8 }}>{p.id}</td>
                    <td style={cell}>{p.displayName}</td>
                    <td style={{ ...cell, paddingTop: '6px' }}><StatusBadge status={p.status} /></td>
                    <td style={{ ...cell, color: p.openIncidents > 0 ? '#E07B39' : 'var(--text-muted)' }}>
                      {p.openIncidents}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Providers table ─────────────────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <p style={sectionLabel}>
            Affected Providers
            {providers.length === 0 && (
              <span style={{ color: 'var(--success)', marginLeft: '12px', fontSize: '0.65rem' }}>
                ALL CLEAR
              </span>
            )}
          </p>
          {providers.length === 0 ? (
            <div style={{ ...card, color: 'var(--text-muted)', fontSize: '0.73rem', textAlign: 'center', padding: '20px' }}>
              No provider incidents detected.
            </div>
          ) : (
            <div style={card}>
              <table style={table}>
                <thead>
                  <tr>
                    {['Provider', 'Category', 'Status', 'Open Incidents', 'Status Page'].map((h) => (
                      <th key={h} style={{ ...headCell, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {providers.map((pr) => (
                    <tr key={pr.id}>
                      <td style={{ ...cell, color: 'var(--accent)', opacity: 0.8 }}>{pr.displayName}</td>
                      <td style={{ ...cell, color: 'var(--text-muted)' }}>{pr.category}</td>
                      <td style={{ ...cell, paddingTop: '6px' }}><StatusBadge status={pr.status} /></td>
                      <td style={{ ...cell, color: '#E07B39' }}>{pr.openIncidents}</td>
                      <td style={cell}>
                        {pr.statusPageUrl ? (
                          <a href={pr.statusPageUrl} target="_blank" rel="noopener noreferrer"
                            style={{ color: 'var(--accent)', opacity: 0.7, textDecoration: 'none', fontSize: '0.65rem' }}>
                            STATUS PAGE ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Incidents table ──────────────────────────────────────────── */}
        <section style={{ marginBottom: '32px' }}>
          <p style={sectionLabel}>
            Open Incidents
            {incidents.length > 0 && (
              <span style={{ color: '#E07B39', marginLeft: '8px' }}>[{incidents.length}]</span>
            )}
          </p>
          {incidents.length === 0 ? (
            <div style={{ ...card, color: 'var(--text-muted)', fontSize: '0.73rem', textAlign: 'center', padding: '20px' }}>
              No open incidents.
            </div>
          ) : (
            <div style={card}>
              <table style={table}>
                <thead>
                  <tr>
                    {['Kind', 'Provider', 'Product', 'Severity', 'Operator Message'].map((h) => (
                      <th key={h} style={{ ...headCell, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id}>
                      <td style={{ ...cell, color: 'var(--text-dim)', fontWeight: 600 }}>{inc.kind}</td>
                      <td style={{ ...cell, color: 'var(--accent)', opacity: 0.8 }}>{inc.provider}</td>
                      <td style={{ ...cell, color: 'var(--text-dim)' }}>{inc.product}</td>
                      <td style={{ ...cell, paddingTop: '6px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 6px', fontSize: '0.6rem',
                          letterSpacing: '0.1em', borderRadius: '2px',
                          border: `1px solid ${SEVERITY_COLOR[inc.severity as HealthEventSeverity]}`,
                          color: SEVERITY_COLOR[inc.severity as HealthEventSeverity],
                        }}>
                          {inc.severity.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...cell, color: 'var(--text-muted)', maxWidth: '320px', lineHeight: '1.5' }}>
                        {inc.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Recommendations panel ────────────────────────────────────── */}
        <section style={{ marginBottom: '48px' }}>
          <p style={sectionLabel}>
            Recommendations
            {recommendations.length > 0 && (
              <span style={{ color: 'var(--gold)', marginLeft: '8px' }}>[{recommendations.length}]</span>
            )}
          </p>
          {recommendations.length === 0 ? (
            <div style={{ ...card, color: 'var(--success)', fontSize: '0.73rem', textAlign: 'center', padding: '20px' }}>
              ✓ No action required. All systems operational.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    ...card,
                    borderLeft: `3px solid ${PRIORITY_COLOR[rec.priority]}`,
                    display: 'grid',
                    gridTemplateColumns: '90px 1fr',
                    gap: '16px',
                    alignItems: 'start',
                  }}
                >
                  <div style={{ paddingTop: '2px' }}>
                    <PriorityBadge priority={rec.priority} />
                  </div>
                  <div>
                    {/* Title */}
                    <div style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.01em' }}>
                      {rec.title}
                    </div>
                    {/* Description */}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', lineHeight: '1.65', marginBottom: '10px' }}>
                      {rec.description}
                    </div>
                    {/* Action label */}
                    <div style={{ fontSize: '0.65rem', color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: '10px', fontWeight: 600 }}>
                      → {rec.actionLabel}
                    </div>
                    {/* Resolution checklist */}
                    {rec.resolutionSteps.length > 0 && (
                      <ol style={{
                        listStyle: 'none',
                        padding: 0,
                        margin: '0 0 12px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}>
                        {rec.resolutionSteps.map((step) => (
                          <li key={step.index} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <span style={{
                              minWidth: '18px',
                              fontSize: '0.6rem',
                              color: PRIORITY_COLOR[rec.priority],
                              opacity: 0.7,
                              marginTop: '2px',
                              fontWeight: 700,
                            }}>
                              {step.index}.
                            </span>
                            <div>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{step.label}</span>
                              {step.command && (
                                <div style={{
                                  fontFamily: 'var(--mono)',
                                  fontSize: '0.63rem',
                                  color: 'var(--accent)',
                                  opacity: 0.75,
                                  background: 'rgba(64,192,208,0.04)',
                                  border: '1px solid rgba(64,192,208,0.12)',
                                  borderRadius: '2px',
                                  padding: '2px 8px',
                                  marginTop: '2px',
                                  display: 'inline-block',
                                }}>
                                  {step.command}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                    {/* Metadata row */}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.62rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                      <span>
                        <span style={{ color: 'var(--accent)', opacity: 0.5, marginRight: '4px' }}>PRODUCTS</span>
                        {rec.affectedProducts.join(', ') || '—'}
                      </span>
                      <span>
                        <span style={{ color: 'var(--accent)', opacity: 0.5, marginRight: '4px' }}>PROVIDERS</span>
                        {rec.affectedProviders.join(', ') || '—'}
                      </span>
                      <span>
                        <span style={{ color: 'var(--accent)', opacity: 0.5, marginRight: '4px' }}>INCIDENTS</span>
                        {rec.incidentIds.length}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '32px' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'flex', gap: '24px' }}>
            <span>PLATFORM jd_ai_systems</span>
            <span>ENGINE platform-health v1</span>
            <span>SNAPSHOT {new Date(generatedAt).toLocaleTimeString()}</span>
            <span>AUDIENCE operator</span>
          </div>
        </footer>

      </main>
    </div>
  )
}
