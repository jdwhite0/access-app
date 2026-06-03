import type { ReactNode } from 'react'
import { cn } from '../cn'

type RuntimeCardProps = {
  title?: string
  children: ReactNode
  className?: string
}

/** Platform shell around terminal/runtime tool output (mono inside). */
export function RuntimeCard({ title, children, className }: RuntimeCardProps) {
  return (
    <div className={cn('access-platform-card access-platform-runtime-card', className)}>
      {title ? <p className="access-platform-meta">{title}</p> : null}
      <div className="access-platform-runtime-card__body">{children}</div>
    </div>
  )
}
