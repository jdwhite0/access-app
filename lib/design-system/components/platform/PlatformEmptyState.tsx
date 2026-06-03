import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '../cn'

type PlatformEmptyStateProps = {
  title: string
  description?: string
  actionHref?: string
  actionLabel?: string
  children?: ReactNode
  className?: string
}

export function PlatformEmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  children,
  className,
}: PlatformEmptyStateProps) {
  return (
    <div className={cn('access-platform-empty', className)}>
      <p className="access-platform-card-title">{title}</p>
      {description ? <p className="access-platform-body">{description}</p> : null}
      {children}
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="access-platform-btn-secondary" style={{ marginTop: 14, display: 'inline-flex' }}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}
