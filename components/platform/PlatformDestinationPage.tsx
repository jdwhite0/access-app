'use client'

import Link from 'next/link'
import { PageHeader, ActionCard } from '@/lib/design-system/components/platform'

type DestinationCard = {
  title: string
  description: string
  href: string
  meta?: string
}

type PlatformDestinationPageProps = {
  eyebrow: string
  title: string
  description: string
  cards: DestinationCard[]
}

export default function PlatformDestinationPage({
  eyebrow,
  title,
  description,
  cards,
}: PlatformDestinationPageProps) {
  return (
    <div className="access-platform access-platform-page access-platform-page--wide">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="access-platform-grid access-platform-grid--3" style={{ marginTop: 24 }}>
        {cards.map((card) => (
          <ActionCard
            key={card.href + card.title}
            title={card.title}
            description={card.description}
            href={card.href}
            meta={card.meta}
          />
        ))}
      </div>
      <p className="access-platform-body" style={{ marginTop: 32 }}>
        <Link href="/dashboard" className="access-platform-link">
          ← Back to Your World
        </Link>
      </p>
    </div>
  )
}
