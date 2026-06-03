'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUser } from '@clerk/nextjs'
import {
  LivingPlanet,
  HomeCommandHero,
} from '@/lib/design-system/components/platform'
import { buildContextualHome, type AttentionItem } from '@/lib/jyson-layer/contextual-awareness'
import { useJysonLayerOptional } from '@/components/jyson/JysonLayerProvider'
import type { RegistrySummary } from '@/types/db'

type AccessHomeProps = {
  summary: RegistrySummary | null
  loading: boolean
  identityError: string | null
}

function resolveAttentionAction(
  item: AttentionItem,
  layer: ReturnType<typeof useJysonLayerOptional>,
  router: ReturnType<typeof useRouter>
) {
  const a = item.action?.toLowerCase() ?? ''
  if (a.includes('plan')) {
    router.push('/plans')
    return
  }
  if (a.includes('billing')) {
    router.push('/settings/billing')
    return
  }
  if (a.includes('agent')) {
    router.push('/agents')
    return
  }
  if (item.action && layer) {
    void layer.submit(item.action)
  }
}

export default function AccessHome({ summary, loading }: AccessHomeProps) {
  const { user } = useUser()
  const layer = useJysonLayerOptional()
  const router = useRouter()
  const [plan, setPlan] = useState<string | null>(null)

  const displayName =
    user?.firstName ??
    user?.fullName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ??
    null

  useEffect(() => {
    if (!user) return
    fetch('/api/identity/plan', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { plan?: string } | null) => {
        if (d?.plan) setPlan(d.plan)
      })
      .catch(() => {})
  }, [user])

  const contextual = useMemo(
    () =>
      buildContextualHome({
        displayName,
        summary,
        loading,
        route: { pathname: '/dashboard', primary: 'home', projectId: null, companionSection: null, settingsSection: null },
        plan,
      }),
    [displayName, summary, loading, plan]
  )

  return (
    <section className="access-home-v3 access-home-v4" aria-label="Home">
      <div className="access-home-v3__atmosphere" aria-hidden />
      <div className="access-home-v3__inner">
        <header className="access-home-v3__hero">
          <LivingPlanet variant="hero" />
        </header>

        <div className="access-home-v4__insight">
          <motion.h1
            className="access-home-v4__headline"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {contextual.headline}
          </motion.h1>
          <motion.p
            className="access-home-v4__insight-text"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {contextual.insight}
          </motion.p>
        </div>

        <HomeCommandHero
          hideHeadline
          placeholder={contextual.commandPlaceholder}
        />

        {contextual.attention.length > 0 ? (
          <ul className="access-home-v4__attention">
            {contextual.attention.map((item) => (
              <li key={item.id} className="access-home-v4__attention-item">
                <span>{item.text}</span>
                {item.action ? (
                  <button
                    type="button"
                    className="access-home-v4__attention-action"
                    onClick={() => resolveAttentionAction(item, layer, router)}
                  >
                    {item.action}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
