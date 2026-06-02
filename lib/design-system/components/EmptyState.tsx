import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string
  children?: ReactNode
}

export function EmptyState({ className, title, children, ...props }: EmptyStateProps) {
  return (
    <div className={cn('access-ds-empty', className)} {...props}>
      <p className="access-ds-empty__title">{title}</p>
      {children ? <div className="access-ds-empty__body">{children}</div> : null}
    </div>
  )
}
