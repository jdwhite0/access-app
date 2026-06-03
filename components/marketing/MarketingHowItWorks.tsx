'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import MarketingLoopVideo, {
  type MarketingVideoSources,
} from '@/components/marketing/MarketingLoopVideo'

const TAB_VIDEOS: Record<'home' | 'guide' | 'plans', MarketingVideoSources> = {
  home: {
    mp4: '/marketing/video/how-home.mp4',
    webm: '/marketing/video/how-home.webm',
    poster: '/marketing/video/how-home-poster.webp',
    fallbackPoster: '/marketing/hero-void-background.webp',
  },
  guide: {
    mp4: '/marketing/video/how-guide.mp4',
    webm: '/marketing/video/how-guide.webm',
    poster: '/marketing/video/how-guide-poster.webp',
    fallbackPoster: '/marketing/hero-void-background.webp',
  },
  plans: {
    mp4: '/marketing/video/how-plans.mp4',
    webm: '/marketing/video/how-plans.webm',
    poster: '/marketing/video/how-plans-poster.webp',
    fallbackPoster: '/marketing/hero-void-background.webp',
  },
}

const TABS = [
  {
    id: 'home',
    label: 'Home',
    headline: 'See your day at a glance',
    body: 'Your ideas, plans, and what you are working on — together on one calm screen.',
    panel: {
      title: 'Good morning',
      subtitle: 'Wednesday · 3 things saved for you',
      rows: [
        { label: 'Next step', value: 'Outline your first offer', accent: true },
        { label: 'Saved note', value: 'Ideas for the side business' },
        { label: 'This week', value: 'Talk with JYSON about pricing' },
      ],
      pill: 'Pick up here',
    },
  },
  {
    id: 'guide',
    label: 'AI guide',
    headline: 'Ask JYSON what to do next',
    body: 'Talk through a decision, shape an offer, or get a gentle nudge — JYSON remembers where you left off.',
    panel: {
      title: 'JYSON',
      subtitle: 'Your guide · remembers your story',
      messages: [
        { role: 'user' as const, text: 'I want to start something small but I keep stalling.' },
        {
          role: 'guide' as const,
          text: 'Last time you mentioned tutoring. Want to sketch one simple offer you could try this week?',
        },
      ],
      pill: "What's next?",
    },
  },
  {
    id: 'plans',
    label: 'Plans',
    headline: 'Plans that grow with you',
    body: 'Start with what you need today. Upgrade when you are ready — no pressure, no clutter.',
    panel: {
      title: 'Your plans',
      subtitle: 'Simple tiers · change anytime',
      tiers: [
        { name: 'Operator', price: '$299', note: 'Organize ideas + JYSON' },
        { name: 'Builder', price: '$599', note: 'Offers + deeper help', featured: true },
        { name: 'Enterprise', price: 'Custom', note: 'For teams together' },
      ],
      pill: 'See all plans',
    },
  },
] as const

type TabId = (typeof TABS)[number]['id']

const reveal = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export default function MarketingHowItWorks() {
  const [active, setActive] = useState<TabId>('home')
  const reduced = useReducedMotion()
  const tab = TABS.find((t) => t.id === active)!

  return (
    <section
      id="how-it-works"
      className="access-mkt-how"
      aria-labelledby="how-it-works-heading"
    >
      <motion.div
        className="access-mkt-how__head"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-8%' }}
        variants={reveal}
      >
        <h2 id="how-it-works-heading" className="access-mkt-how__title">
          See how ACCESS works
        </h2>
        <p className="access-mkt-how__subtitle">
          Home, your AI guide, and plans — connected so you are not juggling five different apps.
        </p>
      </motion.div>

      <div className="access-mkt-how__shell">
        <div
          className="access-mkt-how__tabs"
          role="tablist"
          aria-label="Product areas"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active === t.id}
              aria-controls={`panel-${t.id}`}
              className={[
                'access-mkt-how__tab',
                active === t.id ? 'access-mkt-how__tab--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setActive(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <motion.div
          key={active}
          role="tabpanel"
          id={`panel-${active}`}
          aria-labelledby={`tab-${active}`}
          className="access-mkt-how__panel-wrap"
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <div className="access-mkt-how__copy">
            <h3 className="access-mkt-how__panel-title">{tab.headline}</h3>
            <p className="access-mkt-how__panel-body">{tab.body}</p>
          </div>
          <ProductPanel tab={tab} />
        </motion.div>
      </div>
    </section>
  )
}

type Tab = (typeof TABS)[number]

function ProductPanel({ tab }: { tab: Tab }) {
  const { panel } = tab
  const video = TAB_VIDEOS[tab.id as keyof typeof TAB_VIDEOS]

  return (
    <div className="access-mkt-how__visual">
      <MarketingLoopVideo
        {...video}
        className="access-mkt-how__video"
        ariaHidden
      />
      <div className="access-mkt-ui-mock access-mkt-ui-mock--overlay" aria-hidden>
      <div className="access-mkt-ui-mock__chrome">
        <span className="access-mkt-ui-mock__dot" />
        <span className="access-mkt-ui-mock__dot access-mkt-ui-mock__dot--accent" />
        <span className="access-mkt-ui-mock__dot" />
        <span className="access-mkt-ui-mock__chrome-label">{tab.label}</span>
      </div>
      <div className="access-mkt-ui-mock__body">
        <header className="access-mkt-ui-mock__header">
          <p className="access-mkt-ui-mock__title">{panel.title}</p>
          <p className="access-mkt-ui-mock__subtitle">{panel.subtitle}</p>
        </header>

        {tab.id === 'home' && 'rows' in panel && (
          <ul className="access-mkt-ui-mock__rows">
            {panel.rows.map((row) => (
              <li key={row.label} className="access-mkt-ui-mock__row">
                <span className="access-mkt-ui-mock__row-label">{row.label}</span>
                <span
                  className={[
                    'access-mkt-ui-mock__row-value',
                    'accent' in row && row.accent
                      ? 'access-mkt-ui-mock__row-value--accent'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
        )}

        {tab.id === 'guide' && 'messages' in panel && (
          <div className="access-mkt-ui-mock__thread">
            {panel.messages.map((msg, i) => (
              <div
                key={i}
                className={[
                  'access-mkt-ui-mock__bubble',
                  msg.role === 'user'
                    ? 'access-mkt-ui-mock__bubble--user'
                    : 'access-mkt-ui-mock__bubble--guide',
                ].join(' ')}
              >
                {msg.text}
              </div>
            ))}
          </div>
        )}

        {tab.id === 'plans' && 'tiers' in panel && (
          <ul className="access-mkt-ui-mock__tiers">
            {panel.tiers.map((tier) => (
              <li
                key={tier.name}
                className={[
                  'access-mkt-ui-mock__tier',
                  'featured' in tier && tier.featured
                    ? 'access-mkt-ui-mock__tier--featured'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="access-mkt-ui-mock__tier-name">{tier.name}</span>
                <span className="access-mkt-ui-mock__tier-price">{tier.price}</span>
                <span className="access-mkt-ui-mock__tier-note">{tier.note}</span>
              </li>
            ))}
          </ul>
        )}

        <span className="access-mkt-ui-mock__pill">{panel.pill}</span>
      </div>
      </div>
    </div>
  )
}
