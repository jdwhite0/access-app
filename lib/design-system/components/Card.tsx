import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('access-ds-card', className)} {...props}>
      {children}
    </div>
  )
}
