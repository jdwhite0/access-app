import type { HTMLAttributes } from 'react'
import { cn } from './cn'

export type ModuleHeaderProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: string
  title: string
  subtitle?: string
}

export function ModuleHeader({
  className,
  eyebrow,
  title,
  subtitle,
  ...props
}: ModuleHeaderProps) {
  return (
    <header className={cn('access-ds-module-header', className)} {...props}>
      {eyebrow ? <p className="access-ds-module-header__eyebrow">{eyebrow}</p> : null}
      <h1 className="access-ds-module-header__title">{title}</h1>
      {subtitle ? <p className="access-ds-module-header__sub">{subtitle}</p> : null}
    </header>
  )
}
