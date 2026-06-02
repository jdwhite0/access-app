import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type PanelProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  raised?: boolean
}

export function Panel({ className, children, raised, ...props }: PanelProps) {
  return (
    <div
      className={cn('access-ds-panel', raised && 'access-ds-panel--raised', className)}
      {...props}
    >
      {children}
    </div>
  )
}
