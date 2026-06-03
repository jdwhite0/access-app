import Link from 'next/link'
import { cn } from '../cn'

type ActionCardProps = {
  title: string
  description: string
  href: string
  meta?: string
  className?: string
}

export function ActionCard({ title, description, href, meta, className }: ActionCardProps) {
  return (
    <Link
      href={href}
      className={cn('access-platform-card access-platform-card--interactive access-action-card', className)}
    >
      <h3 className="access-platform-card-title">{title}</h3>
      <p className="access-platform-body">{description}</p>
      {meta ? <p className="access-platform-meta">{meta}</p> : null}
    </Link>
  )
}
