import Link from 'next/link'
import { cn } from '../cn'
import { StatusBadge } from '../StatusBadge'

type BlueprintHealthCardProps = {
  status: 'operational' | 'degraded' | 'offline' | 'blocked'
  statusLabel: string
  title?: string
  summary: string
  items?: { label: string; value: string }[]
  href?: string
  hrefLabel?: string
  className?: string
}

export function BlueprintHealthCard({
  status,
  statusLabel,
  title = 'Founder blueprint',
  summary,
  items,
  href,
  hrefLabel = 'Open Founder OS',
  className,
}: BlueprintHealthCardProps) {
  return (
    <div className={cn('access-platform-card access-platform-blueprint-health', className)}>
      <div className="access-platform-blueprint-health__head">
        <div>
          <p className="access-platform-meta">{title}</p>
          <p className="access-platform-card-title" style={{ marginTop: 8 }}>
            {statusLabel}
          </p>
        </div>
        <StatusBadge variant={status} label={statusLabel} />
      </div>
      <p className="access-platform-body" style={{ marginTop: 12 }}>
        {summary}
      </p>
      {items && items.length > 0 ? (
        <dl className="access-platform-blueprint-health__stats">
          {items.map((item) => (
            <div key={item.label}>
              <dt className="access-platform-meta">{item.label}</dt>
              <dd className="access-platform-body">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {href ? (
        <Link href={href} className="access-platform-link" style={{ marginTop: 14, display: 'inline-block' }}>
          {hrefLabel} →
        </Link>
      ) : null}
    </div>
  )
}
