'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel } from '@/lib/design-system/components/platform'
import type { StripePlan } from '@/lib/stripe/client'
import { getIdentityPlan } from '@/lib/stripe/get-identity-plan'

/** Founder account — hardcoded until schema_v5_billing.sql is applied and plan column is live */
const FOUNDER_HANDLES = ['jdwhite']

const FOUNDER_FEATURES = [
  'JYSON cloud intelligence (unlimited, forever)',
  'ACCESS companion + terminal',
  'Full Founder OS — blueprint, registry, all objects',
  'Local connector + OpenJarvis tools',
  'Admin access to all operator surfaces',
  'No usage limits, no billing, no expiration',
]

const BUILDER_FEATURES = [
  'JYSON cloud intelligence (unlimited chat)',
  'ACCESS companion + terminal',
  'Founder OS blueprint & registry',
  'Systems, projects, agents, offers',
  'Local connector + OpenJarvis tools',
  'Vault scan & sync',
  'Command center access',
  'Priority support',
]

const OPERATOR_FEATURES = [
  'JYSON cloud intelligence',
  'ACCESS companion',
  'Founder OS blueprint',
  'Registry (systems + projects)',
  'Community support',
]

export default function BillingPageClient() {
  const { user } = useUser()
  const router = useRouter()
  const username = user?.username ?? ''
  const isFounder = FOUNDER_HANDLES.includes(username.toLowerCase())
  const [checkoutLoading, setCheckoutLoading] = useState<StripePlan | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [stripeError, setStripeError] = useState<string | null>(null)
  const [dbPlan, setDbPlan] = useState<string | null>(null)
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
  const [planLoading, setPlanLoading] = useState(true)

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const justPaid = searchParams?.get('success') === '1'
  const justCanceled = searchParams?.get('canceled') === '1'

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
  }, [justPaid])

  const effectivePlan = isFounder ? 'founder' : (dbPlan ?? 'free')
  const planLabel =
    effectivePlan === 'founder'
      ? 'Founder'
      : effectivePlan === 'builder'
        ? 'Builder'
        : effectivePlan === 'operator'
          ? 'Operator'
          : effectivePlan === 'free'
            ? 'Free'
            : effectivePlan

  async function handleUpgrade(plan: StripePlan) {
    setCheckoutLoading(plan)
    setStripeError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json() as { url?: string; error?: string }
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
      const data = await res.json() as { url?: string; error?: string }
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
      <div className="access-platform access-platform-page access-platform-page--wide">
        <PageHeader
          eyebrow="Settings"
          title="Billing"
          description={isFounder ? 'Founder account — lifetime access, no billing required.' : 'Your cloud package, usage, and plan management.'}
        />

        {justPaid && (
          <div className="access-billing-banner access-billing-banner--success">
            ✓ Payment successful — your plan is being activated. Refresh in a few seconds after the CLI webhook shows{' '}
            <code>checkout.session.completed</code> → 200.
          </div>
        )}
        {justCanceled && (
          <div className="access-billing-banner access-billing-banner--neutral">
            Checkout canceled — no charge was made.
          </div>
        )}

        <div className="access-settings-profile-grid">
          {/* Current plan */}
          <SectionPanel title="Current plan">
            <div className="access-billing-plan-card" style={isFounder ? { borderColor: 'rgba(201,164,106,0.35)', background: 'rgba(201,164,106,0.03)' } : {}}>
              <div className="access-billing-plan-card__header">
                <div>
                  <p className="access-billing-plan-card__name" style={isFounder ? { color: 'var(--gold, #c9a46a)' } : {}}>
                    {planLoading ? '…' : planLabel}
                  </p>
                  <p className="access-billing-plan-card__price" style={isFounder ? { color: 'var(--gold, #c9a46a)', fontSize: '20px' } : {}}>
                    {isFounder
                      ? 'Lifetime · No charge'
                      : effectivePlan === 'operator'
                        ? '$299 '
                        : effectivePlan === 'builder'
                          ? '$599 '
                          : '— '}
                    {!isFounder && effectivePlan !== 'free' && effectivePlan !== 'founder' && (
                      <span>/month</span>
                    )}
                  </p>
                </div>
                <span
                  className={`access-ds-badge access-ds-badge--${
                    isFounder || effectivePlan === 'founder'
                      ? 'info'
                      : effectivePlan === 'free'
                        ? 'neutral'
                        : 'operational'
                  }`}
                >
                  {planLoading ? '…' : isFounder ? 'Founder' : effectivePlan === 'free' ? 'Free' : 'Active'}
                </span>
              </div>
              <ul className="access-billing-features">
                {(isFounder
                  ? FOUNDER_FEATURES
                  : effectivePlan === 'operator'
                    ? OPERATOR_FEATURES
                    : effectivePlan === 'builder'
                      ? BUILDER_FEATURES
                      : OPERATOR_FEATURES
                ).map(f => (
                  <li key={f}><span className="access-billing-check">✓</span>{f}</li>
                ))}
              </ul>
              <div className="access-billing-plan-card__footer">
                {isFounder ? (
                  <p className="access-platform-meta">
                    This is the founder account. Full access, no billing, no expiration. You may still delete this account from Settings → Account at any time.
                  </p>
                ) : (
                  <>
                    <p className="access-platform-meta">
                      Stripe customer: {stripeCustomerId ?? '—'}
                    </p>
                    <p className="access-platform-meta" style={{ marginTop: 4 }}>
                      Database plan: <strong>{planLoading ? '…' : effectivePlan}</strong>
                    </p>
                  </>
                )}
              </div>
            </div>
          </SectionPanel>

          {/* Upgrade / manage */}
          {!isFounder && (
            <SectionPanel title="Upgrade or manage">
              {stripeError && (
                <p className="access-settings-form__error" style={{ marginBottom: 12 }}>{stripeError}</p>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <button
                  className="access-settings-btn access-settings-btn--secondary"
                  onClick={() => handleUpgrade('operator')}
                  disabled={!!checkoutLoading}
                >
                  {checkoutLoading === 'operator' ? 'Redirecting…' : 'Upgrade to Operator — $299/mo'}
                </button>
                <button
                  className="access-settings-btn access-settings-btn--primary"
                  onClick={() => handleUpgrade('builder')}
                  disabled={!!checkoutLoading}
                >
                  {checkoutLoading === 'builder' ? 'Redirecting…' : 'Upgrade to Builder — $599/mo'}
                </button>
              </div>
              <button
                className="access-settings-btn access-settings-btn--ghost"
                onClick={handlePortal}
                disabled={portalLoading}
                style={{ marginRight: 8 }}
              >
                {portalLoading ? 'Opening…' : 'Manage subscription →'}
              </button>
              <Link href="/plans" className="access-settings-btn access-settings-btn--ghost">
                Compare all plans
              </Link>
            </SectionPanel>
          )}

          {/* Usage */}
          <SectionPanel title="Usage this cycle">
            <div className="access-settings-info-grid">
              <div className="access-settings-info-row">
                <span className="access-platform-meta">JYSON conversations</span>
                <span className="access-settings-info-value">Unlimited</span>
              </div>
              <div className="access-settings-info-row">
                <span className="access-platform-meta">Registry objects</span>
                <span className="access-settings-info-value">Unlimited</span>
              </div>
              <div className="access-settings-info-row">
                <span className="access-platform-meta">Local connector</span>
                <span className="access-settings-info-value">Enabled</span>
              </div>
              <div className="access-settings-info-row">
                <span className="access-platform-meta">OpenJarvis tools</span>
                <span className="access-settings-info-value">Enabled</span>
              </div>
            </div>
          </SectionPanel>

          {/* Enterprise */}
          <SectionPanel title="Enterprise">
            <p className="access-platform-body" style={{ marginBottom: '16px' }}>
              Need white-labeling, multi-user access, custom AI persona, or dedicated infrastructure? Enterprise starts at $2,000/month.
            </p>
            <a
              href="mailto:jerry@jdwhite.world?subject=ACCESS Enterprise"
              className="access-settings-btn access-settings-btn--secondary"
            >
              Contact for Enterprise →
            </a>
          </SectionPanel>
        </div>
      </div>
    </AccessAppLayout>
  )
}
