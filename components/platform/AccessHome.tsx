'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import {
  LivingPlanet,
  HomeCommandHero,
  readRecentIntents,
} from '@/lib/design-system/components/platform'
import {
  buildHomeHeadline,
  buildHomeSubline,
} from '@/lib/jyson-layer/context-lines'
import { useJysonLayerOptional } from '@/components/jyson/JysonLayerProvider'
import type { RegistrySummary } from '@/types/db'

type AccessHomeProps = {
  summary: RegistrySummary | null
  loading: boolean
  identityError: string | null
}

type EmergentTile = {
  id: string
  label: string
  hint: string
  href: string
  count?: number
}

export default function AccessHome({ summary, loading }: AccessHomeProps) {
  const { user } = useUser()
  const layer = useJysonLayerOptional()
  const [recent, setRecent] = useState<string[]>([])

  const displayName =
    user?.firstName ??
    user?.fullName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ??
    null

  const headline = layer?.greeting
    ? `${layer.greeting.replace(/\.$/, '')} — what are we building today?`
    : buildHomeHeadline(displayName)

  const subline = buildHomeSubline(summary, loading)

  useEffect(() => {
    setRecent(readRecentIntents())
  }, [])

  const counts = summary?.registryCounts ?? summary?.counts

  const emergent = useMemo(() => {
    const tiles: EmergentTile[] = []

    if ((counts?.projects ?? 0) > 0) {
      tiles.push({
        id: 'projects',
        label: 'Projects',
        hint: 'In motion',
        href: '/projects',
        count: counts?.projects,
      })
    }
    if ((counts?.agents ?? 0) > 0) {
      tiles.push({
        id: 'agents',
        label: 'Agents',
        hint: 'On your team',
        href: '/agents',
        count: counts?.agents,
      })
    }
    if ((counts?.systems ?? 0) > 0) {
      tiles.push({
        id: 'systems',
        label: 'Systems',
        hint: 'Connected',
        href: '/registry',
        count: counts?.systems,
      })
    }

    return tiles
  }, [counts])

  return (
    <section className="access-home-v3" aria-label="Home">
      <div className="access-home-v3__atmosphere" aria-hidden />
      <div className="access-home-v3__inner">
        <header className="access-home-v3__hero">
          <LivingPlanet variant="hero" />
          <p className="access-home-v3__subline">{subline}</p>
        </header>

        <HomeCommandHero headline={headline} />

        {(recent.length > 0 || emergent.length > 0) && (
          <motion.div
            className="access-home-v3__emergent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            <p className="access-home-v3__emergent-label">Here&apos;s what you&apos;re working on</p>

            {recent.length > 0 ? (
              <ul className="access-home-v3__recent">
                {recent.slice(0, 4).map((intent) => (
                  <li key={intent}>
                    <button
                      type="button"
                      className="access-home-v3__recent-chip"
                      onClick={() => layer?.submit(intent)}
                    >
                      {intent}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="access-home-v3__tiles">
              {emergent.map((tile, i) => (
                <motion.div
                  key={tile.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i, duration: 0.35 }}
                >
                  <Link href={tile.href} className="access-home-v3__tile">
                    <span className="access-home-v3__tile-label">{tile.label}</span>
                    <span className="access-home-v3__tile-hint">{tile.hint}</span>
                    {tile.count != null ? (
                      <span className="access-home-v3__tile-count">{tile.count}</span>
                    ) : null}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {emergent.length === 0 && recent.length === 0 && !loading ? (
          <p className="access-home-v3__emergent-empty access-home-v3__emergent-empty--solo">
            Ask JYSON below — your projects and priorities will surface as we work.
          </p>
        ) : null}

        <footer className="access-home-v3__foot">
          <button
            type="button"
            className="access-home-v3__foot-link"
            onClick={() => layer?.submit('What am I building?')}
          >
            What am I building?
          </button>
          <Link href="/founder" className="access-home-v3__foot-link">
            Identity
          </Link>
          <Link href="/registry" className="access-home-v3__foot-link">
            Map
          </Link>
        </footer>
      </div>
    </section>
  )
}
