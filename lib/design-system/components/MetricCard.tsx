import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type MetricCardProps = HTMLAttributes<HTMLDivElement> & {
  label: string
  value: ReactNode
  hint?: string
}

export function MetricCard({ className, label, value, hint, ...props }: MetricCardProps) {
  return (
    <div className={cn('access-ds-metric', className)} {...props}>
      <span className="access-ds-metric__label">{label}</span>
      <div className="access-ds-metric__value">{value}</div>
      {hint ? <p className="access-ds-metric__hint">{hint}</p> : null}
    </div>
  )
}
