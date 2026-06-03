import { cn } from '../cn'

export type StatusPillTone = 'operational' | 'neutral' | 'offline' | 'degraded' | 'info'

type StatusPillProps = {
  label: string
  tone?: StatusPillTone
  className?: string
}

export function StatusPill({ label, tone = 'neutral', className }: StatusPillProps) {
  return (
    <span className={cn('access-ds-badge', `access-ds-badge--${tone}`, className)}>
      {label}
    </span>
  )
}
