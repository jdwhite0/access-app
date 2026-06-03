'use client'

import { useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Transition,
} from 'framer-motion'

type HeroCard = {
  id: string
  label: string
  pill: string
  accent?: boolean
  gold?: boolean
  hero?: boolean
  style: React.CSSProperties
  rotate: number
  drift: { y: number[]; x: number[] }
  duration: number
  delay: number
  enterDelay: number
}

/** Mom-friendly ACCESS surfaces — plain labels, no dev jargon. */
const HERO_CARDS: HeroCard[] = [
  {
    id: 'next',
    label: 'Your next step',
    pill: 'What should I do next?',
    accent: true,
    hero: true,
    style: { top: '10%', left: '4%' },
    rotate: -4,
    drift: { y: [-8, 10, -8], x: [0, 6, 0] },
    duration: 10,
    delay: 0,
    enterDelay: 0.15,
  },
  {
    id: 'jyson',
    label: 'JYSON',
    pill: 'Pick up where you left off',
    style: { top: '4%', right: '2%' },
    rotate: 3.5,
    drift: { y: [7, -9, 7], x: [-5, 0, -5] },
    duration: 11.5,
    delay: 0.4,
    enterDelay: 0.35,
  },
  {
    id: 'notes',
    label: 'Your business notes',
    pill: 'Saved for you',
    accent: true,
    style: { top: '44%', right: '8%' },
    rotate: 2,
    drift: { y: [-7, 8, -7], x: [5, -3, 5] },
    duration: 12,
    delay: 0.2,
    enterDelay: 0.55,
  },
  {
    id: 'plans',
    label: 'Your plans',
    pill: "Today's focus",
    gold: true,
    style: { bottom: '6%', left: '10%' },
    rotate: -2.5,
    drift: { y: [9, -8, 9], x: [-4, 4, -4] },
    duration: 13,
    delay: 0.6,
    enterDelay: 0.75,
  },
]

function driftTransition(duration: number, delay: number): Transition {
  return { duration, repeat: Infinity, ease: 'easeInOut', delay, repeatType: 'mirror' }
}

type FloatCardProps = {
  card: HeroCard
  reduced: boolean
}

function FloatCard({ card, reduced }: FloatCardProps) {
  const className = [
    'access-mkt-hero-art__float-card',
    card.accent ? 'access-mkt-hero-art__float-card--accent' : '',
    card.gold ? 'access-mkt-hero-art__float-card--gold' : '',
    card.hero ? 'access-mkt-hero-art__float-card--hero' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.div
      className={className}
      style={{ ...card.style, rotate: card.rotate }}
      initial={{ opacity: 0, y: reduced ? 0 : 20, scale: 0.94 }}
      animate={
        reduced
          ? { opacity: 1, y: 0, x: 0, scale: 1, rotate: card.rotate }
          : {
              opacity: 1,
              y: [...card.drift.y],
              x: [...card.drift.x],
              scale: 1,
              rotate: [card.rotate, card.rotate + 1.5, card.rotate],
            }
      }
      transition={
        reduced
          ? { duration: 0.35, delay: card.enterDelay }
          : {
              opacity: { duration: 0.8, delay: card.enterDelay, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: 0.8, delay: card.enterDelay, ease: [0.22, 1, 0.36, 1] },
              y: driftTransition(card.duration, card.enterDelay + 0.85 + card.delay),
              x: driftTransition(card.duration * 1.05, card.enterDelay + 1.05 + card.delay),
              rotate: driftTransition(card.duration * 1.2, card.enterDelay + 0.5 + card.delay),
            }
      }
    >
      <div className="access-mkt-hero-art__float-card-chrome">
        <span className="access-mkt-hero-art__float-card-dot" />
        <span
          className={`access-mkt-hero-art__float-card-dot${card.accent ? ' access-mkt-hero-art__float-card-dot--accent' : ''}`}
        />
        <span className="access-mkt-hero-art__float-card-dot" />
        <span className="access-mkt-hero-art__float-card-label">{card.label}</span>
      </div>
      <div className="access-mkt-hero-art__float-card-body">
        <span
          className={`access-mkt-hero-art__float-card-line${card.accent ? ' access-mkt-hero-art__float-card-line--accent' : ''}`}
        />
        <span className="access-mkt-hero-art__float-card-line" />
        <span className="access-mkt-hero-art__float-card-line access-mkt-hero-art__float-card-line--short" />
        <span className="access-mkt-hero-art__float-card-pill">{card.pill}</span>
      </div>
    </motion.div>
  )
}

/**
 * Stripe / Queue–class hero motion — floating ACCESS product cards, mesh + depth planes.
 * Card stack replaces static illustration for clearer product story.
 */
export default function HeroProductMotion() {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion() ?? false

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start end', 'end start'],
  })
  const floatParallax = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, -16])

  return (
    <div
      ref={rootRef}
      className={`access-mkt-hero-art access-mkt-hero-art--cards${reduced ? ' access-mkt-hero-art--reduced' : ''}`}
      aria-hidden
    >
      <motion.div
        className="access-mkt-hero-art__glow"
        animate={reduced ? undefined : { opacity: [0.72, 1, 0.72] }}
        transition={reduced ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="access-mkt-hero-art__plane access-mkt-hero-art__plane--back" />
      <div className="access-mkt-hero-art__plane access-mkt-hero-art__plane--mid" />
      <div className="access-mkt-hero-art__plane access-mkt-hero-art__plane--front" />

      <div className="access-mkt-hero-art__flow-lines" aria-hidden>
        <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="access-hero-flow" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#0ea5b9" stopOpacity="0" />
              <stop offset="40%" stopColor="#0ea5b9" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#22d3ee" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0ea5b9" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M20 160 Q120 80 200 140 T380 180"
            stroke="url(#access-hero-flow)"
            strokeWidth="1.25"
            strokeLinecap="round"
          />
          <path
            d="M40 220 Q160 180 200 210 T360 250"
            stroke="url(#access-hero-flow)"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.7"
          />
        </svg>
      </div>

      <motion.div className="access-mkt-hero-art__float-layer" style={{ y: floatParallax }}>
        {HERO_CARDS.map((card) => (
          <FloatCard key={card.id} card={card} reduced={reduced} />
        ))}
      </motion.div>
    </div>
  )
}
