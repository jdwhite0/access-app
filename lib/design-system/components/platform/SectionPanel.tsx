import type { ReactNode } from 'react'
import { cn } from '../cn'

type SectionPanelProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionPanel({
  title,
  description,
  actions,
  children,
  className,
}: SectionPanelProps) {
  return (
    <section className={cn('access-platform-section-panel', className)}>
      <div className="access-platform-section-panel__head">
        <div>
          <h2 className="access-platform-section-title">{title}</h2>
          {description ? <p className="access-platform-body">{description}</p> : null}
        </div>
        {actions ? <div className="access-platform-section-panel__actions">{actions}</div> : null}
      </div>
      <div className="access-platform-section-panel__body">{children}</div>
    </section>
  )
}
