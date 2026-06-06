import { getPlanTier, getPlanDisplayPricing } from '@/lib/stripe/plans'
import type { EmbeddedCheckoutPlan } from '@/lib/stripe/actions'
import type { BillingInterval } from '@/lib/stripe/prices'

const MAX_INCLUDES = 7

type Props = {
  plan: EmbeddedCheckoutPlan
  interval?: BillingInterval
}

export default function CheckoutPlanSummary({ plan, interval = 'month' }: Props) {
  const tier = getPlanTier(plan)
  if (!tier) return null

  const pricing = getPlanDisplayPricing(plan, interval)
  const includes = tier.includes.slice(0, MAX_INCLUDES)

  return (
    <div className="access-checkout-v2__summary">
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #40C0D0, #1a8fa0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontFamily: 'monospace', fontWeight: 700, flexShrink: 0 }}>A</div>
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: '#0a2540', fontFamily: 'monospace' }}>ACCESS</span>
      </div>
      <h1 className="access-checkout-v2__title">{tier.title}</h1>
      {interval === 'year' ? (
        <p className="access-checkout-v2__commitment-badge">Annual commitment</p>
      ) : null}
      <p className="access-checkout-v2__price-line">
        <span className="access-checkout-v2__price">
          ${pricing.amount.toLocaleString('en-US')}
        </span>
        <span className="access-checkout-v2__period">{pricing.periodLabel}</span>
      </p>
      {interval === 'year' && pricing.equivalentMonthly ? (
        <p className="access-checkout-v2__compare">
          ${pricing.equivalentMonthly}/month equivalent
        </p>
      ) : null}
      {pricing.savingsLabel ? (
        <p className="access-checkout-v2__savings">{pricing.savingsLabel}</p>
      ) : null}
      <p className="access-checkout-v2__description">{tier.checkoutDescription}</p>
      <ul className="access-checkout-v2__includes" aria-label="Plan includes">
        {includes.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
