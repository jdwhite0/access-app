import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../cn'

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string
  children: ReactNode
  className?: string
}

export function PrimaryButton({ href, children, className, ...rest }: PrimaryButtonProps) {
  const cls = cn('access-platform-btn-primary', className)
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  )
}
