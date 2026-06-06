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
 *
 * New env vars (preferred):
 *   STRIPE_PRICE_PERSONAL_MONTHLY / STRIPE_PRICE_PERSONAL_ANNUAL
 *   STRIPE_PRICE_BUILDER_MONTHLY  / STRIPE_PRICE_BUILDER_ANNUAL
 *
 * Legacy env vars still supported for operator:
 *   STRIPE_PRICE_OPERATOR_MONTHLY / STRIPE_PRICE_OPERATOR_ANNUAL
 *   STRIPE_PRICE_OPERATOR (legacy fallback)
 */
export function getStripePriceId(
  plan: PaidPlan,
  interval: BillingInterval
): string | undefined {
  if (plan === 'personal') {
    return interval === 'month'
      ? envPrice(process.env.STRIPE_PRICE_PERSONAL_MONTHLY)
      : envPrice(process.env.STRIPE_PRICE_PERSONAL_ANNUAL)
  }

  if (plan === 'operator') {
    // legacy — falls back through old env var names
    return interval === 'month'
      ? (envPrice(process.env.STRIPE_PRICE_OPERATOR_MONTHLY) ?? envPrice(process.env.STRIPE_PRICE_OPERATOR))
      : envPrice(process.env.STRIPE_PRICE_OPERATOR_ANNUAL)
  }

  // builder
  return interval === 'month'
    ? (envPrice(process.env.STRIPE_PRICE_BUILDER_MONTHLY) ?? envPrice(process.env.STRIPE_PRICE_BUILDER))
    : envPrice(process.env.STRIPE_PRICE_BUILDER_ANNUAL)
}

/**
 * Annual billing is available when Personal (or legacy Operator) AND Builder
 * both have valid annual Price IDs configured.
 */
export function isAnnualBillingEnabled(): boolean {
  const personalAnnual =
    !!getStripePriceId('personal', 'year') || !!getStripePriceId('operator', 'year')
  const builderAnnual = !!getStripePriceId('builder', 'year')
  return personalAnnual && builderAnnual
}

export function getMonthlyStripePriceId(plan: PaidPlan): string | undefined {
  return getStripePriceId(plan, 'month')
}
