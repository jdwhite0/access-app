import Stripe from 'stripe'
import { getMonthlyStripePriceId } from './prices'

const STRIPE_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_PRICE_OPERATOR',
  'STRIPE_PRICE_BUILDER',
  'STRIPE_PRICE_OPERATOR_MONTHLY',
  'STRIPE_PRICE_OPERATOR_ANNUAL',
  'STRIPE_PRICE_BUILDER_MONTHLY',
  'STRIPE_PRICE_BUILDER_ANNUAL',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_APP_URL',
] as const

export type StripeEnvVarName = (typeof STRIPE_ENV_VARS)[number]

/** All Stripe-related env var names (for Vercel dashboard / docs). */
export const REQUIRED_STRIPE_ENV_VARS: readonly StripeEnvVarName[] = STRIPE_ENV_VARS

function stripeRuntime(): 'vercel' | 'local' | 'unknown' {
  if (process.env.VERCEL) return 'vercel'
  if (process.env.NODE_ENV === 'development') return 'local'
  return 'unknown'
}

/** Actionable hint when STRIPE_SECRET_KEY is missing (no secret values). */
export function stripeSecretKeySetupHint(): string {
  if (stripeRuntime() === 'vercel') {
    return (
      'Set STRIPE_SECRET_KEY in Vercel → Project **app** → Settings → Environment Variables → ' +
      'Production (use sk_live_ for live mode or sk_test_ for test). Redeploy after saving. ' +
      'See access-app/docs/STRIPE_LOCAL_SETUP.md § Production (Vercel).'
    )
  }
  return (
    'Add STRIPE_SECRET_KEY=sk_test_... to access-app/.env.local (see .env.local.example), ' +
    'then restart the dev server. Never commit .env.local.'
  )
}

export function getMissingStripeSecretMessage(): string {
  return `Stripe is not configured: STRIPE_SECRET_KEY is missing. ${stripeSecretKeySetupHint()}`
}

export function getMissingStripeWebhookMessage(): string {
  const where =
    stripeRuntime() === 'vercel'
      ? 'Vercel → Project app → Environment Variables → Production (Dashboard webhook signing secret whsec_...)'
      : 'access-app/.env.local (Stripe CLI `stripe listen` whsec_...; see docs/STRIPE_LOCAL_SETUP.md)'
  return `STRIPE_WEBHOOK_SECRET is not set. Configure it in ${where}.`
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(`[stripe] STRIPE_SECRET_KEY not set — payment features disabled. ${stripeSecretKeySetupHint()}`)
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-05-27.dahlia' })
  : null

export type StripePlan = 'operator' | 'builder' | 'enterprise'

/** Monthly Price IDs (legacy STRIPE_PRICE_* fall back in getMonthlyStripePriceId). */
export const PLAN_PRICE_MAP: Record<StripePlan, string | undefined> = {
  operator: getMonthlyStripePriceId('operator'),
  builder: getMonthlyStripePriceId('builder'),
  enterprise: undefined,
}

export const PLAN_NAMES: Record<StripePlan, string> = {
  operator:   'ACCESS Operator',
  builder:    'ACCESS Builder',
  enterprise: 'ACCESS Enterprise',
}

export function stripeEnabled(): boolean {
  return !!stripe
}
