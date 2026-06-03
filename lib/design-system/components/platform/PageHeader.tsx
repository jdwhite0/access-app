import type { ReactNode } from 'react'
import { cn } from '../cn'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('access-platform-page-header', className)}>
      <div className="access-platform-page-header__main">
        {eyebrow ? <p className="access-platform-eyebrow">{eyebrow}</p> : null}
        <h1 className="access-platform-page-title">{title}</h1>
        {description ? <p className="access-platform-body">{description}</p> : null}
      </div>
      {actions ? <div className="access-platform-page-header__actions">{actions}</div> : null}
    </header>
  )
}
