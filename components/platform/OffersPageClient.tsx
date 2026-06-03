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
          description="Package what you sell and connect it to subscriptions, checkout, and delivery."
          actions={
            <PrimaryButton href="/terminal">Create offer</PrimaryButton>
          }
          secondary={
            <SecondaryButton href="/settings/billing">Connect Stripe</SecondaryButton>
          }
        />

        <SectionPanel
          title="Monetization status"
          description="What is live today — no projected revenue until checkout is connected."
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
            <SecondaryButton href="/plans">View plans</SecondaryButton>
          </div>
          <div className="access-capability-row">
            <div>
              <p className="access-settings-row__title">Stripe checkout</p>
              <p className="access-settings-row__desc">
                {stripeConnected
                  ? 'Billing identity is linked. Confirm webhooks in Billing after checkout.'
                  : 'Not connected — complete checkout in Billing to accept payments.'}
              </p>
            </div>
            <StatusPill
              label={stripeConnected ? 'Account linked' : 'Not connected'}
              tone={stripeConnected ? 'operational' : 'neutral'}
            />
          </div>
          <div className="access-capability-row">
            <div>
              <p className="access-settings-row__title">Revenue tracking</p>
              <p className="access-settings-row__desc">
                Offer records live in your registry. Revenue dashboards are not built in this release.
              </p>
            </div>
            <StatusPill label="Not available yet" tone="neutral" />
          </div>
        </SectionPanel>

        {loading ? (
          <div className="access-platform-loading">Loading offers…</div>
        ) : offers.length === 0 ? (
          <PlatformEmptyState
            title="No offers yet"
            description="You do not have any offers yet. Create your first offer in Terminal with /register-offer, or ask JYSON to help package what you sell."
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

        <SectionPanel title="Next offer to build">
          <p className="access-platform-body">
            Use Terminal to register offers, then connect Stripe in{' '}
            <Link href="/settings/billing">Billing</Link> so checkout can attach to a plan.
          </p>
        </SectionPanel>
      </div>
    </AccessAppLayout>
  )
}
