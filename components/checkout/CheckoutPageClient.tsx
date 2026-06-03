'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import Link from 'next/link'
import CheckoutV2Layout from './CheckoutV2Layout'
import CheckoutPlanSummary from './CheckoutPlanSummary'
import type { EmbeddedCheckoutPlan } from '@/lib/stripe/actions'
import type { BillingInterval } from '@/lib/stripe/prices'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

type Props = {
  plan: EmbeddedCheckoutPlan
  interval?: BillingInterval
}

export default function CheckoutPageClient({ plan, interval = 'month' }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setClientSecret(null)

    fetch('/api/stripe/embedded-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, interval }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { clientSecret?: string; error?: string }
        if (cancelled) return
        if (!res.ok || !data.clientSecret) {
          setError(data.error ?? 'Could not start checkout.')
          return
        }
        setClientSecret(data.clientSecret)
      })
      .catch(() => {
        if (!cancelled) setError('Could not reach payment service.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [plan, interval])

  const paymentPanel = (() => {
    if (!publishableKey || !stripePromise) {
      return (
        <div className="access-checkout-v2__stripe">
          <div className="access-checkout-v2__error">
            Stripe publishable key is not configured.
          </div>
        </div>
      )
    }

    if (loading) {
      return (
        <div className="access-checkout-v2__stripe">
          <div className="access-checkout-v2__loading">
            <div className="access-checkout-v2__spinner" aria-hidden />
            <span>Preparing checkout…</span>
          </div>
        </div>
      )
    }

    if (error || !clientSecret) {
      return (
        <div className="access-checkout-v2__stripe">
          <div className="access-checkout-v2__error">
            <p>{error ?? 'Checkout unavailable.'}</p>
            <Link href="/plans">Return to plans</Link>
          </div>
        </div>
      )
    }

    return (
      <div className="access-checkout-v2__stripe">
        <div className="access-checkout-v2__embed">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
        <p className="access-checkout-v2__trust">Secure payment via Stripe</p>
      </div>
    )
  })()

  return (
    <CheckoutV2Layout summary={<CheckoutPlanSummary plan={plan} interval={interval} />}>
      {paymentPanel}
    </CheckoutV2Layout>
  )
}
