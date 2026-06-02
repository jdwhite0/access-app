'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type NavigationItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  glyph?: ReactNode
  active?: boolean
  badge?: string
}

export function NavigationItem({
  className,
  label,
  glyph,
  active,
  badge,
  children,
  ...props
}: NavigationItemProps) {
  return (
    <button
      type="button"
      className={cn('access-ds-nav-item', active && 'is-active', className)}
      aria-current={active ? 'page' : undefined}
      {...props}
    >
      {glyph ? <span className="access-ds-nav-item__glyph">{glyph}</span> : null}
      <span className="access-ds-nav-item__label">{label}</span>
      {badge ? <span className="access-ds-nav-item__badge">{badge}</span> : null}
      {children}
    </button>
  )
}
