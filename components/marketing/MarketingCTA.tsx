'use client'

import Link from 'next/link'

type Variant = 'accent' | 'primary' | 'secondary'

type BaseProps = {
  children: React.ReactNode
  className?: string
}

type ButtonProps = BaseProps & {
  onClick?: () => void
  type?: 'button' | 'submit'
}

type LinkProps = BaseProps & {
  href: string
}

function classes(variant: Variant, className?: string) {
  return [
    'access-mkt-cta',
    `access-mkt-cta--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

export function MarketingCTAButton({
  variant = 'accent',
  children,
  onClick,
  type = 'button',
  className,
}: ButtonProps & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={classes(variant, className)}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function MarketingCTALink({
  variant = 'secondary',
  href,
  children,
  className,
}: LinkProps & { variant?: Variant }) {
  return (
    <Link href={href} className={classes(variant, className)}>
      {children}
    </Link>
  )
}
