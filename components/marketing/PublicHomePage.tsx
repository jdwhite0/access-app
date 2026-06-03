'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import AccessMarketingLayout from '@/components/marketing/AccessMarketingLayout'
import PublicHeader from '@/components/marketing/PublicHeader'
import HeroProductMotion from '@/components/marketing/HeroProductMotion'
import HeroAmbientVideo from '@/components/marketing/HeroAmbientVideo'
import HeroCinematicVideo from '@/components/marketing/HeroCinematicVideo'
import TrustStrip from '@/components/marketing/TrustStrip'
import MarketingHowItWorks from '@/components/marketing/MarketingHowItWorks'
import { MarketingCTAButton, MarketingCTALink } from '@/components/marketing/MarketingCTA'
import { useMarketingAuthActions } from '@/components/marketing/useMarketingAuthActions'
import {
  PLAN_MONTHLY_USD,
  PLAN_TIERS,
} from '@/lib/stripe/plans'

const CAPABILITIES = [
  {
    title: 'One place for your ideas',
    body: 'Business notes, plans, and what you are working on — kept together so nothing gets lost in the shuffle.',
  },
  {
    title: 'JYSON, your AI guide',
    body: 'Ask what to do next, talk through a decision, or shape an offer. JYSON listens and suggests steps that fit you.',
  },
  {
    title: 'Memory that picks up where you left off',
    body: 'Save what matters. When you return days or weeks later, the conversation continues — you do not repeat yourself.',
  },
] as const

/** Homepage-only plan blurbs — warmer than shared tier subtitles used elsewhere. */
const HOME_PLAN_BLURBS: Record<'operator' | 'builder' | 'enterprise', string> = {
  operator:
    'Organize your ideas with JYSON, your plans, and memory — a calm place for your next chapter.',
  builder:
    'Everything in the first plan, plus offers and deeper help from JYSON as your business grows.',
  enterprise:
    'For teams who want ACCESS together, with support tailored to how you work.',
}

const revealEase = [0.22, 1, 0.36, 1] as const

const reveal = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.08, ease: revealEase },
  }),
}

function formatUsd(n: number) {
  return `$${n.toLocaleString('en-US')}`
}

export default function PublicHomePage() {
  const { startBuilding } = useMarketingAuthActions()
  const operator = PLAN_TIERS.find((t) => t.id === 'operator')!
  const builder = PLAN_TIERS.find((t) => t.id === 'builder')!
  const enterprise = PLAN_TIERS.find((t) => t.id === 'enterprise')!

  return (
    <AccessMarketingLayout>
      <PublicHeader />

      {/* —— Hero: Stripe scale + Queue triad —— */}
      <section className="access-mkt-hero" aria-labelledby="hero-heading">
        <div className="access-mkt-hero__canvas" aria-hidden>
          <HeroCinematicVideo />
          <HeroAmbientVideo />
        </div>
        <div className="access-mkt-hero__inner">
          <div className="access-mkt-hero__copy">
            <p className="access-mkt-hero__eyebrow">For life&apos;s new chapters</p>
            <h1 id="hero-heading" className="access-mkt-hero__title">
              Starting over
              <br />
              is allowed.
            </h1>
            <p className="access-mkt-hero__lead">
              New parent, new business, or simply scared and hopeful — one calm place for your
              ideas and notes.
            </p>
            <p className="access-mkt-hero__triad">
              <strong>Plan your next step</strong>
              <span aria-hidden> · </span>
              <strong>Save what matters</strong>
              <span aria-hidden> · </span>
              <strong>AI that remembers you</strong>
            </p>
            <div className="access-mkt-hero__ctas">
              <MarketingCTAButton variant="accent" onClick={startBuilding}>
                Get started
              </MarketingCTAButton>
              <MarketingCTALink href="/contact" variant="secondary">
                Talk with us
              </MarketingCTALink>
            </div>
            <p className="access-mkt-hero__risk">
              Start with what you have today — upgrade when you&apos;re ready.
            </p>
          </div>
          <HeroProductMotion />
        </div>
        <div className="access-mkt-hero__footer">
          <TrustStrip />
        </div>
      </section>

      <main className="access-marketing-main">
        {/* —— Pain band (Queue chapter rhythm) —— */}
        <section
          id="pain"
          className="access-mkt-pain"
          aria-labelledby="pain-heading"
        >
          <motion.div
            className="access-mkt-pain__inner"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-8%' }}
            variants={reveal}
            custom={0}
          >
            <h2 id="pain-heading" className="access-mkt-pain__title">
              Tired of starting over every time?
            </h2>
            <p className="access-mkt-pain__body">
              Scattered notes, five different apps, and explaining yourself again — ACCESS keeps
              your story in one place so you can pick up where you left off.
            </p>
          </motion.div>
        </section>

        {/* —— Capability triad —— */}
        <section
          id="capability"
          className="access-marketing-section access-marketing-section--flush"
          aria-labelledby="capability-cards-heading"
        >
          <h2 id="capability-cards-heading" className="access-marketing-visually-hidden">
            How ACCESS helps
          </h2>
          <ul className="access-marketing-features">
            {CAPABILITIES.map((item, i) => (
              <motion.li
                key={item.title}
                className="access-marketing-feature"
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-8%' }}
                variants={reveal}
              >
                <h3 className="access-marketing-feature__title">{item.title}</h3>
                <p className="access-marketing-feature__body">{item.body}</p>
              </motion.li>
            ))}
          </ul>
        </section>

        {/* —— Tabbed product walkthrough —— */}
        <MarketingHowItWorks />

        {/* —— Help strip —— */}
        <section
          id="help-support"
          className="access-marketing-strip"
          aria-labelledby="help-heading"
        >
          <div className="access-marketing-strip__inner">
            <h2 id="help-heading" className="access-marketing-strip__title">
              Help when you need it
            </h2>
            <nav className="access-marketing-strip__links" aria-label="Help links">
              <Link href="/contact">Talk with us</Link>
              <Link href="/status">Platform status</Link>
              <Link href="/plans">Plans &amp; pricing</Link>
            </nav>
          </div>
        </section>

        {/* —— Plans preview —— */}
        <section
          id="plans"
          className="access-marketing-section"
          aria-labelledby="plans-heading"
        >
          <motion.div
            className="access-marketing-section__head"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-8%' }}
            variants={reveal}
            custom={0}
          >
            <h2 id="plans-heading" className="access-marketing-section__title">
              Simple plans as you grow
            </h2>
            <p className="access-marketing-section__subtitle">
              Starting something new is hard. We built ACCESS to meet you where you are — start
              with what you need, upgrade when you&apos;re ready.
            </p>
          </motion.div>
          <div className="access-marketing-plans">
            <article className="access-marketing-plan">
              <p className="access-marketing-plan__name">{operator.shortName}</p>
              <p className="access-marketing-plan__price">
                {formatUsd(PLAN_MONTHLY_USD.operator)}
                <span className="access-marketing-plan__period">/month</span>
              </p>
              <p className="access-marketing-plan__desc">{HOME_PLAN_BLURBS.operator}</p>
            </article>
            <article className="access-marketing-plan access-marketing-plan--featured">
              <span className="access-marketing-plan__badge">Recommended</span>
              <p className="access-marketing-plan__name">{builder.shortName}</p>
              <p className="access-marketing-plan__price">
                {formatUsd(PLAN_MONTHLY_USD.builder)}
                <span className="access-marketing-plan__period">/month</span>
              </p>
              <p className="access-marketing-plan__desc">{HOME_PLAN_BLURBS.builder}</p>
            </article>
            <article className="access-marketing-plan">
              <p className="access-marketing-plan__name">{enterprise.shortName}</p>
              <p className="access-marketing-plan__price">Custom</p>
              <p className="access-marketing-plan__desc">{HOME_PLAN_BLURBS.enterprise}</p>
            </article>
          </div>
          <p className="access-marketing-plans-link">
            <MarketingCTALink href="/plans" variant="secondary">
              See plans
            </MarketingCTALink>
          </p>
        </section>

        {/* —— Final CTA —— */}
        <section className="access-marketing-cta-band" aria-labelledby="final-cta-heading">
          <h2 id="final-cta-heading" className="access-marketing-cta-band__title">
            Ready when you are
          </h2>
          <p className="access-marketing-cta-band__body">
            Create your account, save your first idea, and let JYSON help you see what comes next.
          </p>
          <div className="access-marketing-cta-band__actions">
            <MarketingCTAButton variant="accent" onClick={startBuilding}>
              Get started
            </MarketingCTAButton>
            <MarketingCTALink href="/contact" variant="primary">
              Talk with us
            </MarketingCTALink>
          </div>
        </section>

        <footer className="access-marketing-footer">
          <span>© {new Date().getFullYear()} JD AI Systems — ACCESS</span>
          <Link href="/plans">Pricing</Link>
          <Link href="/contact">Contact</Link>
        </footer>
      </main>
    </AccessMarketingLayout>
  )
}
