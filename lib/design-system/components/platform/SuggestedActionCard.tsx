import Link from 'next/link'
import { cn } from '../cn'

type SuggestedActionCardProps = {
  title: string
  description: string
  actionLabel: string
  href?: string
  onAction?: () => void
  className?: string
}

export function SuggestedActionCard({
  title,
  description,
  actionLabel,
  href,
  onAction,
  className,
}: SuggestedActionCardProps) {
  const inner = (
    <>
      <p className="access-home-card__title">{title}</p>
      <p className="access-home-card__desc">{description}</p>
      <span className="access-home-card__action">{actionLabel}</span>
    </>
  )

  if (href && !onAction) {
    return (
      <Link href={href} className={cn('access-home-card', className)}>
        {inner}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={cn('access-home-card', className)}
      style={{ textAlign: 'left', cursor: 'pointer' }}
      onClick={onAction}
    >
      {inner}
    </button>
  )
}
