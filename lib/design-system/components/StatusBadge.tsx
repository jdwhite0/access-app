import type { HTMLAttributes } from 'react'
import { cn } from './cn'

export type StatusBadgeVariant =
  | 'operational'
  | 'degraded'
  | 'blocked'
  | 'offline'
  | 'error'
  | 'info'
  | 'neutral'

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: StatusBadgeVariant
  label: string
}

export function StatusBadge({
  className,
  variant = 'neutral',
  label,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn('access-ds-badge', `access-ds-badge--${variant}`, className)}
      {...props}
    >
      {label}
    </span>
  )
}
