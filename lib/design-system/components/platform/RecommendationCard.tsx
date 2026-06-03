import Link from 'next/link'
import { cn } from '../cn'

type RecommendationCardProps = {
  title: string
  description: string
  href?: string
  meta?: string
  priority?: 'high' | 'normal'
  className?: string
}

export function RecommendationCard({
  title,
  description,
  href,
  meta,
  priority = 'normal',
  className,
}: RecommendationCardProps) {
  const inner = (
    <>
      <div className="access-platform-recommendation__head">
        <h3 className="access-platform-card-title">{title}</h3>
        {priority === 'high' ? (
          <span className="access-platform-recommendation__badge">Priority</span>
        ) : null}
      </div>
      <p className="access-platform-body">{description}</p>
      {meta ? <p className="access-platform-meta">{meta}</p> : null}
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'access-platform-card access-platform-card--interactive access-platform-recommendation',
          className
        )}
      >
        {inner}
      </Link>
    )
  }

  return (
    <div className={cn('access-platform-card access-platform-recommendation', className)}>
      {inner}
    </div>
  )
}
