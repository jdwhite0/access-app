import type { StripePlan } from './client'

export type BillingInterval = 'month' | 'year'
export type PaidPlan = Exclude<StripePlan, 'enterprise'>

/** Stripe Checkout requires Price IDs (`price_...`), not Product IDs (`prod_...`) or dollar amounts. */
export function isValidStripePriceId(value: string | undefined): boolean {
  const trimmed = value?.trim()
  return !!trimmed && trimmed.startsWith('price_')
}

function envPrice(value: string | undefined): string | undefined {
  return isValidStripePriceId(value) ? value!.trim() : undefined
}

/**
 * Resolve Stripe Price ID for a paid plan and billing interval.
 * Monthly: STRIPE_PRICE_*_MONTHLY, else legacy STRIPE_PRICE_OPERATOR / BUILDER.
 */
export function getStripePriceId(
  plan: PaidPlan,
  interval: BillingInterval
): string | undefined {
  if (interval === 'month') {
    if (plan === 'operator') {
      return (
        envPrice(process.env.STRIPE_PRICE_OPERATOR_MONTHLY) ??
        envPrice(process.env.STRIPE_PRICE_OPERATOR)
      )
    }
    return (
      envPrice(process.env.STRIPE_PRICE_BUILDER_MONTHLY) ??
      envPrice(process.env.STRIPE_PRICE_BUILDER)
    )
  }

  if (plan === 'operator') {
    return envPrice(process.env.STRIPE_PRICE_OPERATOR_ANNUAL)
  }
  return envPrice(process.env.STRIPE_PRICE_BUILDER_ANNUAL)
}

/** Both paid plans need annual Price IDs before the plans page enables annual checkout. */
export function isAnnualBillingEnabled(): boolean {
  return (
    !!getStripePriceId('operator', 'year') && !!getStripePriceId('builder', 'year')
  )
}

export function getMonthlyStripePriceId(plan: PaidPlan): string | undefined {
  return getStripePriceId(plan, 'month')
}
