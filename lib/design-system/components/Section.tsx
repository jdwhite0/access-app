import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type SectionProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: string
  title?: string
  description?: string
  children?: ReactNode
}

export function Section({
  className,
  eyebrow,
  title,
  description,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn('access-ds-section', className)} {...props}>
      {eyebrow ? <p className="access-ds-section__eyebrow">{eyebrow}</p> : null}
      {title ? <h2 className="access-ds-section__title">{title}</h2> : null}
      {description ? <p className="access-ds-section__desc">{description}</p> : null}
      {children}
    </section>
  )
}
