import type { ReactNode } from 'react'
import { cn } from '../cn'

type IntelligenceCardProps = {
  title?: string
  eyebrow?: string
  children: ReactNode
  className?: string
}

export function IntelligenceCard({
  title,
  eyebrow = 'Intelligence',
  children,
  className,
}: IntelligenceCardProps) {
  return (
    <article className={cn('access-platform-card access-platform-intelligence-card', className)}>
      <header className="access-platform-intelligence-card__head">
        <p className="access-platform-eyebrow">{eyebrow}</p>
        {title ? <h3 className="access-platform-card-title">{title}</h3> : null}
      </header>
      <div className="access-platform-intelligence-card__body">{children}</div>
    </article>
  )
}
