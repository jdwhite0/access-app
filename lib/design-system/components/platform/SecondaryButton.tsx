import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../cn'

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string
  children: ReactNode
  className?: string
}

export function SecondaryButton({ href, children, className, ...rest }: SecondaryButtonProps) {
  const cls = cn('access-platform-btn-secondary', className)
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
