'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  PLAN_TIERS,
  getPlanBadges,
  getPlanCta,
  getPlanDisplayPricing,
  type PlanTierConfig,
} from '@/lib/stripe/plans'
import type { BillingInterval } from '@/lib/stripe/prices'
import { PrimaryButton, SecondaryButton } from '@/lib/design-system/components/platform'

const ENTERPRISE_CONTACT = '/contact'

const WHY_ACCESS = [
  {
    title: 'One place for your ideas',
    body: 'Notes, plans, and offers stay together so you are not hunting across apps.',
  },
  {
    title: 'JYSON guides your next step',
    body: 'Ask what matters now — JYSON suggests small, clear moves based on your story.',
  },
  {
    title: 'Picks up where you left off',
    body: 'Memory keeps your context so every return feels like continuing, not restarting.',
  },
] as const

type Props = {
  annualBillingEnabled: boolean
}

function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

function checkoutHref(plan: 'operator' | 'builder', interval: BillingInterval): string {
  return `/checkout/${plan}?interval=${interval}`
}

function PlanCard({
  tier,
  interval,
  annualBillingEnabled,
}: {
  tier: PlanTierConfig
  interval: BillingInterval
  annualBillingEnabled: boolean
}) {
  const isEnterprise = tier.id === 'enterprise'
  const isFeatured = tier.highlight
  const annualUnavailable = interval === 'year' && !annualBillingEnabled
  const badges = getPlanBadges(tier.id, interval)

  if (isEnterprise) {
    return (
      <article className="access-plans-v2__card">
        <div className="access-plans-v2__badges">
          {badges.map((badge) => (
            <span key={badge} className="access-plans-v2__badge">
              {badge}
            </span>
          ))}
        </div>
        <p className="access-plans-v2__plan-name">{tier.shortName}</p>
        <div className="access-plans-v2__price-block">
          <div className="access-plans-v2__price-row">
            <span className="access-plans-v2__price">Custom</span>
          </div>
        </div>
        <p className="access-plans-v2__card-desc">{tier.subtitle}</p>
        <ul className="access-plans-v2__includes">
          {tier.includes.map((item) => (
            <li key={item}>
              <span className="access-plans-v2__check" aria-hidden>
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
        <div className="access-plans-v2__cta">
          <SecondaryButton href={ENTERPRISE_CONTACT}>{tier.cta}</SecondaryButton>
        </div>
      </article>
    )
  }

  const paidPlan = tier.id as 'operator' | 'builder'
  const pricing = getPlanDisplayPricing(paidPlan, interval)
  const ctaLabel = getPlanCta(paidPlan, interval)

  return (
    <article
      className={`access-plans-v2__card${isFeatured ? ' access-plans-v2__card--featured' : ''}`}
    >
      <div className="access-plans-v2__badges">
        {badges.map((badge) => {
          const upper = badge.toUpperCase()
          const isRecommended = upper === 'RECOMMENDED'
          const isCommitment = upper.includes('ANNUAL COMMITMENT')
          return (
            <span
              key={badge}
              className={`access-plans-v2__badge${
                isRecommended
                  ? ' access-plans-v2__badge--recommended'
                  : isCommitment
                    ? ' access-plans-v2__badge--commitment'
                    : ''
              }`}
            >
              {badge}
            </span>
          )
        })}
      </div>
      <p className="access-plans-v2__plan-name">{tier.shortName}</p>
      <div className="access-plans-v2__price-block">
        <div className="access-plans-v2__price-row">
          <span className="access-plans-v2__price">{formatUsd(pricing.amount)}</span>
          <span className="access-plans-v2__period">{pricing.periodLabel}</span>
        </div>
        {interval === 'year' && pricing.equivalentMonthly ? (
          <p className="access-plans-v2__compare">
            {formatUsd(pricing.equivalentMonthly)}/month equivalent
          </p>
        ) : null}
        {pricing.savingsLabel ? (
          <p className="access-plans-v2__helper">{pricing.savingsLabel}</p>
        ) : null}
      </div>
      <p className="access-plans-v2__card-desc">{tier.subtitle}</p>
      <ul className="access-plans-v2__includes">
        {tier.includes.map((item) => (
          <li key={item}>
            <span className="access-plans-v2__check" aria-hidden>
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
      <div className="access-plans-v2__cta">
        {annualUnavailable ? (
          <span className="access-plans-v2__cta-disabled" role="status">
            Annual commitment unavailable
          </span>
        ) : (
          <PrimaryButton href={checkoutHref(paidPlan, interval)} style={{ width: '100%' }}>
            {ctaLabel}
          </PrimaryButton>
        )}
      </div>
    </article>
  )
}

export default function PlansPageClient({ annualBillingEnabled }: Props) {
  const [interval, setInterval] = useState<BillingInterval>('month')
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    fetch('/api/identity/plan', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { plan?: string } | null) => setCurrentPlan(d?.plan ?? null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (interval === 'year' && !annualBillingEnabled) {
      setInterval('month')
    }
  }, [interval, annualBillingEnabled])

  return (
    <div className="access-plans-v2">
      <div className="access-plans-v2__inner">
        <Link href="/dashboard" className="access-plans-v2__back">
          ← Back to Home
        </Link>

        <header className="access-plans-v2__hero">
          <p className="access-plans-v2__eyebrow">Plans</p>
          <h1 className="access-plans-v2__title">
            Choose the plan that fits you
          </h1>
          <p className="access-plans-v2__subtitle">
            One place for your business ideas and notes. JYSON as your AI guide. Memory that
            picks up where you left off.
          </p>
          {currentPlan && currentPlan !== 'free' ? (
            <p className="access-plans-v2__current">
              Current plan: <strong>{currentPlan}</strong>.{' '}
              <Link href="/settings/billing">Manage billing</Link>
            </p>
          ) : null}
        </header>

        <div className="access-plans-v2__toggle-wrap">
          <div className="access-plans-v2__toggle" role="group" aria-label="Billing interval">
            <button
              type="button"
              className={`access-plans-v2__toggle-btn${interval === 'month' ? ' access-plans-v2__toggle-btn--active' : ''}`}
              onClick={() => setInterval('month')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`access-plans-v2__toggle-btn${interval === 'year' ? ' access-plans-v2__toggle-btn--active' : ''}`}
              onClick={() => annualBillingEnabled && setInterval('year')}
              disabled={!annualBillingEnabled}
              title={
                !annualBillingEnabled && !isDev
                  ? 'Annual commitment is not available yet'
                  : undefined
              }
            >
              Annual
            </button>
          </div>
          <p className="access-plans-v2__toggle-hint">
            Monthly is flexible. Annual saves more when you are ready to stay for the year.
          </p>
          {isDev && !annualBillingEnabled ? (
            <p className="access-plans-v2__dev-warn" role="status">
              Dev: set STRIPE_PRICE_OPERATOR_ANNUAL and STRIPE_PRICE_BUILDER_ANNUAL to valid{' '}
              <code>price_...</code> IDs, then restart the dev server.
            </p>
          ) : null}
        </div>

        <div className="access-plans-v2__grid">
          {PLAN_TIERS.map((tier) => (
            <PlanCard
              key={tier.id}
              tier={tier}
              interval={interval}
              annualBillingEnabled={annualBillingEnabled}
            />
          ))}
        </div>

        <section className="access-plans-v2__section" aria-labelledby="commitment-heading">
          <h2 id="commitment-heading" className="access-plans-v2__section-title">
            Build for the year
          </h2>
          <p className="access-plans-v2__section-body">
            Pay for the year upfront and lock in a lower rate while you grow with ACCESS.
          </p>
        </section>

        <section
          className="access-plans-v2__section access-plans-v2__section--wide"
          aria-labelledby="why-heading"
        >
          <h2 id="why-heading" className="access-plans-v2__section-title">
            Why people choose ACCESS
          </h2>
          <div className="access-plans-v2__reasons">
            {WHY_ACCESS.map((item) => (
              <div key={item.title} className="access-plans-v2__reason-card">
                <h3 className="access-plans-v2__reason-title">{item.title}</h3>
                <p className="access-plans-v2__reason-body">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="access-plans-v2__section" aria-labelledby="serious-heading">
          <h2 id="serious-heading" className="access-plans-v2__section-title">
            Built for real life, not hype
          </h2>
          <p className="access-plans-v2__section-body">
            Whether you are starting a business, returning after a break, or juggling family and
            work — ACCESS keeps your ideas in one place and JYSON helps you see what comes next.
          </p>
        </section>

        <footer className="access-plans-v2__footer">
          <SecondaryButton href="/settings/billing">Manage billing</SecondaryButton>
          <Link href="/dashboard">Back to Home →</Link>
        </footer>
      </div>
    </div>
  )
}
