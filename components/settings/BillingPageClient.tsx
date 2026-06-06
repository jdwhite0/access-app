'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader } from '@/lib/design-system/components/platform'
import type { StripePlan } from '@/lib/stripe/client'
import { getIdentityPlan } from '@/lib/stripe/get-identity-plan'

const C = {
  bg:     '#FFFFFF',
  bgAlt:  '#F7F9FC',
  bgDark: '#0A2540',
  text:   '#0A2540',
  sub:    '#425466',
  mute:   '#697386',
  border: '#E6EBF1',
  accent: '#40C0D0',
  green:  '#2D8A6E',
  red:    '#E55A2B',
} as const

const FOUNDER_HANDLES = ['jdwhite']

const PLAN_DETAILS: Record<string, { label: string; price: string; desc: string; color: string }> = {
  founder:    { label: 'Founder',    price: 'Lifetime · Free',  desc: 'Full platform access. No charge, no expiration.', color: '#C9A46A' },
  enterprise: { label: 'Enterprise', price: '$299/month',       desc: 'Unlimited access, team seats, API, dedicated support.', color: '#7C6CF8' },
  builder:    { label: 'Builder',    price: '$99/month',        desc: 'Full platform, 1,000 JYSON messages/month, all modules.', color: C.accent },
  personal:   { label: 'Personal',   price: '$29/month',        desc: '100 JYSON messages/month, core modules, personal vault.', color: C.green },
  operator:   { label: 'Personal',   price: '$29/month',        desc: '100 JYSON messages/month, core modules, personal vault.', color: C.green },
  free:       { label: 'Free',       price: '$0',               desc: 'Limited access. Upgrade to unlock the full platform.', color: C.mute },
}

function Row({ label, value, action }: { label: string; value: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: `1px solid ${C.border}`, gap: 16, flexWrap: 'wrap' }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 13, color: C.sub, margin: '3px 0 0', lineHeight: 1.4 }}>{value}</p>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

function Btn({ children, onClick, disabled, variant = 'secondary' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: C.bgDark, color: '#fff', border: 'none' },
    secondary: { background: C.bgAlt, color: C.text, border: `1px solid ${C.border}` },
    ghost:     { background: 'transparent', color: C.sub, border: `1px solid ${C.border}` },
    danger:    { background: 'transparent', color: C.red, border: `1px solid ${C.red}22` },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...styles[variant], borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap' }}
    >
      {children}
    </button>
  )
}

function Card({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
      <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}` }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>{title}</p>
        {subtitle && <p style={{ fontSize: 13, color: C.mute, margin: '3px 0 0' }}>{subtitle}</p>}
      </div>
      <div style={{ padding: '0 24px' }}>{children}</div>
    </div>
  )
}

export default function BillingPageClient() {
  const { user } = useUser()
  const username = user?.username ?? ''
  const isFounder = FOUNDER_HANDLES.includes(username.toLowerCase())

  const [checkoutLoading, setCheckoutLoading] = useState<StripePlan | null>(null)
  const [portalLoading,   setPortalLoading]   = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [dbPlan,          setDbPlan]          = useState<string | null>(null)
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
  const [planLoading,     setPlanLoading]     = useState(true)

  useEffect(() => {
    let cancelled = false
    void getIdentityPlan().then((result) => {
      if (cancelled) return
      if ('data' in result) {
        setDbPlan(result.data.plan)
        setStripeCustomerId(result.data.stripe_customer_id)
      }
      setPlanLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  const effectivePlan = isFounder ? 'founder' : (dbPlan ?? 'free')
  const planInfo = PLAN_DETAILS[effectivePlan] ?? PLAN_DETAILS.free
  const hasStripe = !!stripeCustomerId
  const isPaid = ['personal', 'operator', 'builder', 'enterprise'].includes(effectivePlan)

  async function handlePortal() {
    setPortalLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) { window.location.href = data.url } else { setError(data.error ?? 'Could not open billing portal.') }
    } catch { setError('Could not connect to Stripe.') }
    finally { setPortalLoading(false) }
  }

  async function handleUpgrade(plan: StripePlan) {
    setCheckoutLoading(plan)
    setError(null)
    try {
      const res  = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) { window.location.href = data.url } else { setError(data.error ?? 'Checkout failed.') }
    } catch { setError('Could not connect to Stripe.') }
    finally { setCheckoutLoading(null) }
  }

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-shell-page access-shell-page--wide">
        <PageHeader
          title="Billing"
          description="Manage your plan, payment methods, and invoices."
        />

        {error && (
          <div style={{ background: '#FFF5F0', border: '1px solid #FDBA74', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: C.red }}>
            {error}
          </div>
        )}

        <div style={{ maxWidth: 720 }}>

          {/* Current Plan */}
          <Card title="Current plan" subtitle="Your active subscription and entitlements.">
            {planLoading ? (
              <div style={{ padding: '20px 0', color: C.mute, fontSize: 14 }}>Loading…</div>
            ) : (
              <>
                <Row
                  label={planInfo.label}
                  value={planInfo.desc}
                  action={
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: planInfo.color }}>{planInfo.price}</span>
                      {!isFounder && isPaid && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: `${C.green}18`, color: C.green, padding: '3px 8px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Active</span>
                      )}
                    </div>
                  }
                />
                {!isFounder && !isPaid && (
                  <div style={{ padding: '20px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <Btn variant="primary" onClick={() => handleUpgrade('builder')} disabled={!!checkoutLoading}>
                      {checkoutLoading === 'builder' ? 'Redirecting…' : 'Upgrade to Builder — $99/mo'}
                    </Btn>
                    <Btn variant="secondary" onClick={() => handleUpgrade('personal')} disabled={!!checkoutLoading}>
                      {checkoutLoading === 'personal' ? 'Redirecting…' : 'Start Personal — $29/mo'}
                    </Btn>
                    <Link href="/plans" style={{ display: 'inline-flex', alignItems: 'center', fontSize: 13, color: C.accent, textDecoration: 'none', fontWeight: 600 }}>
                      Compare all plans →
                    </Link>
                  </div>
                )}
                {!isFounder && isPaid && effectivePlan !== 'enterprise' && (
                  <div style={{ padding: '16px 0' }}>
                    <Btn variant="ghost" onClick={() => handleUpgrade('builder')} disabled={effectivePlan === 'builder' || !!checkoutLoading}>
                      {effectivePlan === 'builder' ? 'Already on Builder' : checkoutLoading === 'builder' ? 'Redirecting…' : 'Upgrade to Builder'}
                    </Btn>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Payment Method */}
          {!isFounder && (
            <Card title="Payment method" subtitle="Card or bank account on file for this subscription.">
              <Row
                label={hasStripe ? 'Payment method on file' : 'No payment method'}
                value={
                  hasStripe
                    ? 'Your payment details are managed securely through Stripe. Update, add, or remove methods in the billing portal.'
                    : 'Subscribe to a paid plan to add a payment method. Card, debit, and bank transfer accepted.'
                }
                action={
                  hasStripe ? (
                    <Btn variant="secondary" onClick={handlePortal} disabled={portalLoading}>
                      {portalLoading ? 'Opening…' : 'Update payment method'}
                    </Btn>
                  ) : undefined
                }
              />
              {hasStripe && (
                <Row
                  label="Bank transfer (ACH)"
                  value="Switch to bank transfer at any time through the billing portal. Available for US bank accounts on Builder and Enterprise plans."
                  action={
                    <Btn variant="ghost" onClick={handlePortal} disabled={portalLoading}>
                      {portalLoading ? 'Opening…' : 'Manage in portal'}
                    </Btn>
                  }
                />
              )}
            </Card>
          )}

          {/* Invoices & Billing History */}
          {!isFounder && (
            <Card title="Invoices & billing history" subtitle="View, download, or email your past invoices.">
              <Row
                label={hasStripe ? 'Billing history available' : 'No invoices yet'}
                value={
                  hasStripe
                    ? 'Your full invoice history is available in the Stripe billing portal. Download PDF receipts or set up automatic email delivery.'
                    : 'Invoices will appear here once you subscribe to a paid plan.'
                }
                action={
                  hasStripe ? (
                    <Btn variant="secondary" onClick={handlePortal} disabled={portalLoading}>
                      {portalLoading ? 'Opening…' : 'View invoices'}
                    </Btn>
                  ) : undefined
                }
              />
            </Card>
          )}

          {/* Manage Subscription */}
          {!isFounder && isPaid && (
            <Card title="Manage subscription" subtitle="Change your plan, billing cycle, or cancel at any time.">
              <Row
                label="Billing portal"
                value="Change billing cycle, update your address, download receipts, or cancel your subscription. Takes effect at the end of your current period."
                action={
                  <Btn variant="secondary" onClick={handlePortal} disabled={portalLoading || !hasStripe}>
                    {portalLoading ? 'Opening…' : 'Open billing portal →'}
                  </Btn>
                }
              />
              <Row
                label="Cancel subscription"
                value="You can cancel any time. You'll keep access until the end of your billing period."
                action={
                  <Btn variant="danger" onClick={handlePortal} disabled={portalLoading || !hasStripe}>
                    {portalLoading ? 'Opening…' : 'Cancel plan'}
                  </Btn>
                }
              />
            </Card>
          )}

          {/* Founder badge */}
          {isFounder && (
            <Card title="Founder account">
              <Row
                label="Lifetime access"
                value="Full platform access, no charge, no expiration. This account is permanently provisioned."
              />
            </Card>
          )}

          <p style={{ fontSize: 12, color: C.mute, marginTop: 8, lineHeight: 1.5 }}>
            Payments and billing are processed securely by{' '}
            <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" style={{ color: C.accent }}>Stripe</a>.
            JD AI Systems does not store card details.{' '}
            <Link href="/privacy" style={{ color: C.mute, textDecoration: 'underline' }}>Privacy Policy</Link>
            {' · '}
            <Link href="/terms" style={{ color: C.mute, textDecoration: 'underline' }}>Terms</Link>
          </p>
        </div>
      </div>
    </AccessAppLayout>
  )
}
