import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type CommandButtonVariant = 'primary' | 'ghost'

export type CommandButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: CommandButtonVariant
}

export function CommandButton({
  className,
  children,
  variant = 'primary',
  type = 'button',
  ...props
}: CommandButtonProps) {
  return (
    <button
      type={type}
      className={cn('access-ds-cmd-btn', `access-ds-cmd-btn--${variant}`, className)}
      {...props}
    >
      {children}
    </button>
  )
}
