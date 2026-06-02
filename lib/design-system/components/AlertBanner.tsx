import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type AlertBannerVariant = 'info' | 'warning' | 'error' | 'success'

export type AlertBannerProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertBannerVariant
  children: ReactNode
}

export function AlertBanner({
  className,
  variant = 'info',
  children,
  role = 'status',
  ...props
}: AlertBannerProps) {
  return (
    <div
      role={role}
      className={cn('access-ds-alert', `access-ds-alert--${variant}`, className)}
      {...props}
    >
      {children}
    </div>
  )
}
