'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import {
  PageHeader,
  SectionPanel,
  PlatformEmptyState,
  PrimaryButton,
  SecondaryButton,
  StatusPill,
} from '@/lib/design-system/components/platform'
import { listOffers } from '@/lib/actions/offers'
import type { Offer } from '@/types/db'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_TONE: Record<string, 'operational' | 'neutral' | 'degraded' | 'offline'> = {
  active: 'operational',
  draft: 'neutral',
  paused: 'degraded',
  archived: 'offline',
}

function OfferCard({ offer }: { offer: Offer }) {
  return (
    <div className="access-offer-card">
      <div className="access-offer-card__header">
        <div>
          <p className="access-offer-card__name">{offer.name}</p>
          {offer.pricing && <p className="access-offer-card__price">{offer.pricing}</p>}
        </div>
        <StatusPill label={offer.status} tone={STATUS_TONE[offer.status] ?? 'neutral'} />
      </div>
      {offer.description && <p className="access-offer-card__desc">{offer.description}</p>}
      {offer.delivery && (
        <p className="access-platform-meta">
          Delivery: {offer.delivery}
        </p>
      )}
      <p className="access-platform-meta" style={{ marginTop: 8 }}>
        Updated {fmtDate(offer.updated_at ?? offer.created_at)}
      </p>
    </div>
  )
}

export default function OffersPageClient() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<string | null>(null)

  useEffect(() => {
    listOffers()
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false))
    fetch('/api/identity/plan', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { plan?: string } | null) => setPlan(d?.plan ?? null))
      .catch(() => {})
  }, [])

  const active = offers.filter((o) => o.status === 'active')
  const drafts = offers.filter((o) => o.status === 'draft')
  const other = offers.filter((o) => o.status !== 'active' && o.status !== 'draft')
  const stripeConnected = !!plan && plan !== 'free'

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-shell-page">
        <PageHeader
          title="Offers"
          description="What you sell — products, services, packages, and subscriptions connected to your revenue."
          actions={
            <PrimaryButton href="/terminal">Create offer</PrimaryButton>
          }
          secondary={
            <SecondaryButton href="/settings/billing">Connect Stripe</SecondaryButton>
          }
        />

        <SectionPanel
          title="Monetization status"
          description="What's connected and live today."
        >
          <div className="access-capability-row">
            <div>
              <p className="access-settings-row__title">Subscription plan</p>
              <p className="access-settings-row__desc">
                {plan && plan !== 'free'
                  ? `You are on the ${plan} plan.`
                  : 'No paid plan active — upgrade to unlock more leverage.'}
              </p>
            </div>
            <SecondaryButton href="/plans">Compare all plans</SecondaryButton>
          </div>
          <div className="access-capability-row">
            <div>
              <p className="access-settings-row__title">Stripe</p>
              <p className="access-settings-row__desc">
                {stripeConnected
                  ? 'Billing identity linked — confirm webhooks in Billing after checkout.'
                  : 'Connect Stripe to accept payments and attach offers to checkout.'}
              </p>
            </div>
            <StatusPill
              label={stripeConnected ? 'Connected' : 'Not connected'}
              tone={stripeConnected ? 'operational' : 'neutral'}
            />
          </div>
        </SectionPanel>

        {loading ? (
          <div className="access-platform-loading">Loading offers…</div>
        ) : offers.length === 0 ? (
          <PlatformEmptyState
            title="No offers registered yet."
            description="Offers are the products and services you sell — packages, retainers, subscriptions, and services. Register your first offer to connect it to Stripe and track your revenue."
            actionHref="/terminal"
            actionLabel="Create offer"
          />
        ) : (
          <div className="access-shell-sections">
            {active.length > 0 && (
              <SectionPanel title={`Active offers (${active.length})`} description="Live packages you can sell.">
                <div className="access-offers-grid">
                  {active.map((o) => (
                    <OfferCard key={o.id} offer={o} />
                  ))}
                </div>
              </SectionPanel>
            )}
            {drafts.length > 0 && (
              <SectionPanel title={`Drafts (${drafts.length})`}>
                <div className="access-offers-grid">
                  {drafts.map((o) => (
                    <OfferCard key={o.id} offer={o} />
                  ))}
                </div>
              </SectionPanel>
            )}
            {other.length > 0 && (
              <SectionPanel title={`Other (${other.length})`}>
                <div className="access-offers-grid">
                  {other.map((o) => (
                    <OfferCard key={o.id} offer={o} />
                  ))}
                </div>
              </SectionPanel>
            )}
          </div>
        )}

        <SectionPanel title="Connect Stripe to enable checkout">
          <p className="access-platform-body">
            Register offers in Terminal, then connect Stripe in{' '}
            <Link href="/settings/billing">Billing</Link> so each offer can attach to a checkout session.
            Once connected, buyers can purchase directly from your offer links.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <SecondaryButton href="/settings/billing">Connect Stripe</SecondaryButton>
            <SecondaryButton href="/terminal">Register offer in terminal</SecondaryButton>
          </div>
        </SectionPanel>
      </div>
    </AccessAppLayout>
  )
}
