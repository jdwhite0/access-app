'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel } from '@/lib/design-system/components/platform'
import type { StripePlan } from '@/lib/stripe/client'
import { getIdentityPlan } from '@/lib/stripe/get-identity-plan'

const FOUNDER_HANDLES = ['jdwhite']

export default function BillingPageClient() {
  const { user } = useUser()
  const username = user?.username ?? ''
  const isFounder = FOUNDER_HANDLES.includes(username.toLowerCase())
  const [checkoutLoading, setCheckoutLoading] = useState<StripePlan | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [stripeError, setStripeError] = useState<string | null>(null)
  const [dbPlan, setDbPlan] = useState<string | null>(null)
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
  const [planLoading, setPlanLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setPlanLoading(true)
    void getIdentityPlan().then((result) => {
      if (cancelled) return
      if ('data' in result) {
        setDbPlan(result.data.plan)
        setStripeCustomerId(result.data.stripe_customer_id)
      }
      setPlanLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const effectivePlan = isFounder ? 'founder' : (dbPlan ?? 'free')
  const planLabel =
    effectivePlan === 'founder'
      ? 'Founder'
      : effectivePlan === 'builder'
        ? 'Builder'
        : effectivePlan === 'personal' || effectivePlan === 'operator'
          ? 'Personal'
          : effectivePlan === 'free'
            ? 'Free'
            : effectivePlan

  const monthlyPrice =
    effectivePlan === 'personal' || effectivePlan === 'operator'
      ? '$29/month'
      : effectivePlan === 'builder'
        ? '$99/month'
        : effectivePlan === 'enterprise'
          ? '$299/month'
          : isFounder
            ? 'Lifetime · No charge'
            : '—'

  async function handleUpgrade(plan: StripePlan) {
    setCheckoutLoading(plan)
    setStripeError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setStripeError(data.error ?? 'Checkout failed.')
      }
    } catch {
      setStripeError('Could not connect to Stripe. Check your internet connection.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    setStripeError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setStripeError(data.error ?? 'Could not open billing portal.')
      }
    } catch {
      setStripeError('Could not connect to Stripe.')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-shell-page access-shell-page--wide">
        <PageHeader
          title="Billing"
          description={
            isFounder
              ? 'Founder account — lifetime access, no payment required.'
              : 'Your subscription, payment method, and invoices.'
          }
        />

        {stripeError ? (
          <p className="access-settings-form__error" style={{ marginBottom: 12 }}>
            {stripeError}
          </p>
        ) : null}

        <div className="access-settings-profile-grid">
          <SectionPanel title="Current plan">
            <div className="access-shell-panel">
              <div className="access-shell-list-row">
                <div className="access-shell-list-row__main">
                  <p className="access-shell-list-row__title">Current plan</p>
                  <p className="access-shell-list-row__sub">
                    {planLoading ? 'Loading…' : planLabel}
                    {!isFounder && effectivePlan !== 'free' ? ' · Active' : ''}
                  </p>
                </div>
                <span className="access-settings-info-value">{monthlyPrice}</span>
              </div>
            </div>
          </SectionPanel>

          {!isFounder && (
            <>
              <SectionPanel title="Payment method">
                <div className="access-shell-panel">
                  <div className="access-shell-list-row">
                    <div className="access-shell-list-row__main">
                      <p className="access-shell-list-row__title">Payment method</p>
                      <p className="access-shell-list-row__sub">
                        {stripeCustomerId
                          ? 'Managed in Stripe — update card or billing details in the portal.'
                          : 'No payment method on file. Subscribe to add one at checkout.'}
                      </p>
                    </div>
                  </div>
                </div>
              </SectionPanel>

              <SectionPanel title="Next payment">
                <div className="access-shell-panel">
                  <div className="access-shell-list-row">
                    <div className="access-shell-list-row__main">
                      <p className="access-shell-list-row__title">Next payment</p>
                      <p className="access-shell-list-row__sub">
                        {effectivePlan === 'free'
                          ? 'No active subscription.'
                          : 'Shown in Stripe Customer Portal after your first invoice.'}
                      </p>
                    </div>
                  </div>
                </div>
              </SectionPanel>

              <SectionPanel title="Manage subscription">
                <p className="access-platform-body" style={{ marginBottom: 16 }}>
                  Update payment method, cancel, or change billing details in Stripe.
                </p>
                <button
                  className="access-settings-btn access-settings-btn--secondary"
                  onClick={handlePortal}
                  disabled={portalLoading || !stripeCustomerId}
                  style={{ marginRight: 8 }}
                >
                  {portalLoading ? 'Opening…' : 'Manage subscription'}
                </button>
                <button
                  className="access-settings-btn access-settings-btn--ghost"
                  onClick={handlePortal}
                  disabled={portalLoading || !stripeCustomerId}
                >
                  {portalLoading ? 'Opening…' : 'View invoices'}
                </button>
              </SectionPanel>

              <SectionPanel title="Upgrade plan">
                <p className="access-platform-body" style={{ marginBottom: 12 }}>
                  Upgrade to Builder to unlock unlimited projects, CRM, workflows, offers, and full
                  JYSON business intelligence. Start with a free 14-day trial.
                </p>
                <p className="access-platform-meta" style={{ marginBottom: 16 }}>
                  Builder ($99/month) is for founders, creators, consultants, agencies, nonprofits, and operators.
                  Enterprise ($299/month) adds team seats, RBAC, compliance tools, and API access.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {effectivePlan !== 'personal' && effectivePlan !== 'operator' && effectivePlan !== 'builder' ? (
                    <button
                      className="access-settings-btn access-settings-btn--secondary"
                      onClick={() => handleUpgrade('personal')}
                      disabled={!!checkoutLoading}
                    >
                      {checkoutLoading === 'personal' ? 'Redirecting…' : 'Start Personal — $29/mo'}
                    </button>
                  ) : null}
                  {effectivePlan !== 'builder' ? (
                    <button
                      className="access-settings-btn access-settings-btn--primary"
                      onClick={() => handleUpgrade('builder')}
                      disabled={!!checkoutLoading}
                    >
                      {checkoutLoading === 'builder' ? 'Redirecting…' : 'Start Builder — $99/mo'}
                    </button>
                  ) : null}
                  <Link href="/plans" className="access-settings-btn access-settings-btn--ghost">
                    Compare all plans
                  </Link>
                  <Link href="/contact" className="access-settings-btn access-settings-btn--ghost">
                    Contact us — Enterprise
                  </Link>
                </div>
              </SectionPanel>
            </>
          )}

          {isFounder && (
            <SectionPanel title="Founder account">
              <p className="access-platform-meta">
                Full access, no billing, no expiration. You may delete this account from Settings →
                Account at any time.
              </p>
            </SectionPanel>
          )}
        </div>
      </div>
    </AccessAppLayout>
  )
}
