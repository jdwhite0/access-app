import { cn } from '@/lib/design-system/components/cn'
import type { ReactNode } from 'react'

type GlassPanelProps = {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function GlassPanel({ children, className, hover }: GlassPanelProps) {
  return (
    <div className={cn('access-glass-panel', hover && 'access-glass-panel--hover', className)}>
      {children}
    </div>
  )
}
