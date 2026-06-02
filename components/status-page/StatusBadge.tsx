import type { HealthStatus } from '@/lib/platform-health'

const STATUS_COLOR: Record<HealthStatus, string> = {
  operational: 'var(--success)',
  degraded: 'var(--gold)',
  partial_outage: '#E07B39',
  blocked: '#E05252',
  offline: '#880000',
  unknown: 'var(--text-muted)',
}

const STATUS_LABEL: Record<HealthStatus, string> = {
  operational: 'OPERATIONAL',
  degraded: 'DEGRADED',
  partial_outage: 'PARTIAL OUTAGE',
  blocked: 'BLOCKED',
  offline: 'OFFLINE',
  unknown: 'UNKNOWN',
}

export function StatusBadge({ status }: { status: HealthStatus | string }) {
  const key = status as HealthStatus
  const color = STATUS_COLOR[key] ?? 'var(--text-muted)'
  const label = STATUS_LABEL[key] ?? String(status).toUpperCase()
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: '0.62rem',
        letterSpacing: '0.1em',
        fontFamily: 'var(--mono)',
        border: `1px solid ${color}`,
        color,
        borderRadius: '2px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
