import type { ReactNode } from 'react'
import { cn } from '../cn'

type MetricCardProps = {
  label: string
  value: ReactNode
  hint?: string
  className?: string
}

export function MetricCard({ label, value, hint, className }: MetricCardProps) {
  return (
    <div className={cn('access-platform-card access-platform-metric-card', className)}>
      <p className="access-platform-meta">{label}</p>
      <div className="access-platform-metric-card__value">{value}</div>
      {hint ? <p className="access-platform-body access-platform-metric-card__hint">{hint}</p> : null}
    </div>
  )
}
