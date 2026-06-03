'use client'

import { useEffect, useState } from 'react'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel, PlatformEmptyState } from '@/lib/design-system/components/platform'
import { listOffers } from '@/lib/actions/offers'
import type { Offer } from '@/types/db'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_COLOR: Record<string, string> = {
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
          {offer.pricing && (
            <p className="access-offer-card__price">{offer.pricing}</p>
          )}
        </div>
        <span className={`access-ds-badge access-ds-badge--${STATUS_COLOR[offer.status] ?? 'neutral'}`}>
          {offer.status}
        </span>
      </div>
      {offer.description && (
        <p className="access-offer-card__desc">{offer.description}</p>
      )}
      {offer.delivery && (
        <div className="access-offer-card__delivery">
          <span className="access-platform-meta">Delivery</span>
          <span className="access-offer-card__delivery-text">{offer.delivery}</span>
        </div>
      )}
      <p className="access-platform-meta" style={{ marginTop: 12 }}>Added {fmtDate(offer.created_at)}</p>
    </div>
  )
}

export default function OffersPageClient() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listOffers()
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false))
  }, [])

  const active = offers.filter(o => o.status === 'active')
  const drafts = offers.filter(o => o.status === 'draft')
  const other = offers.filter(o => o.status !== 'active' && o.status !== 'draft')

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page">
        <PageHeader
          eyebrow="ACCESS"
          title="Offers"
          description="Your service packages and products — what you sell, what you deliver, and what you charge."
          actions={
            <button
              className="access-platform-action-btn"
              onClick={() => alert('Use the Terminal to register a new offer: /register-offer')}
            >
              + New offer
            </button>
          }
        />

        {loading ? (
          <div className="access-platform-loading">Loading offers…</div>
        ) : offers.length === 0 ? (
          <PlatformEmptyState
            title="No offers registered"
            description="Register your service packages, products, and delivery structures. Every offer becomes part of your digital business architecture."
            actionHref="/terminal"
            actionLabel="Register via Terminal"
          />
        ) : (
          <div className="access-projects-sections">
            {active.length > 0 && (
              <SectionPanel
                title={`Active offers (${active.length})`}
                description="Your live packages — what clients are buying right now."
              >
                <div className="access-offers-grid">
                  {active.map(o => <OfferCard key={o.id} offer={o} />)}
                </div>
              </SectionPanel>
            )}
            {drafts.length > 0 && (
              <SectionPanel title={`Drafts (${drafts.length})`}>
                <div className="access-offers-grid">
                  {drafts.map(o => <OfferCard key={o.id} offer={o} />)}
                </div>
              </SectionPanel>
            )}
            {other.length > 0 && (
              <SectionPanel title={`Other (${other.length})`}>
                <div className="access-offers-grid">
                  {other.map(o => <OfferCard key={o.id} offer={o} />)}
                </div>
              </SectionPanel>
            )}
          </div>
        )}
      </div>
    </AccessAppLayout>
  )
}
