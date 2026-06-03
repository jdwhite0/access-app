import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[stripe] STRIPE_SECRET_KEY not set — payment features disabled')
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' })
  : null

export type StripePlan = 'operator' | 'builder' | 'enterprise'

export const PLAN_PRICE_MAP: Record<StripePlan, string | undefined> = {
  operator:   process.env.STRIPE_PRICE_OPERATOR,
  builder:    process.env.STRIPE_PRICE_BUILDER,
  enterprise: undefined, // contact sales
}

export const PLAN_NAMES: Record<StripePlan, string> = {
  operator:   'ACCESS Operator',
  builder:    'ACCESS Builder',
  enterprise: 'ACCESS Enterprise',
}

export function stripeEnabled(): boolean {
  return !!stripe
}
