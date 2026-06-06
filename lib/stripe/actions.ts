'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import {
  stripe,
  PLAN_NAMES,
  getMissingStripeSecretMessage,
  type StripePlan,
} from './client'
import { getCheckoutBrandingSettings, resolveAppOrigin } from './branding'
import { buildCheckoutSessionMetadata, getPlanTier, LAUNCH_COUPON_ID } from './plans'
import { ensureStripeCustomer } from './customer'
import {
  getStripePriceId,
  isAnnualBillingEnabled,
  type BillingInterval,
} from './prices'

export type EmbeddedCheckoutPlan = Exclude<StripePlan, 'enterprise'>

async function buildSubscriptionCheckoutBase(
  plan: EmbeddedCheckoutPlan,
  userId: string,
  interval: BillingInterval = 'month'
): Promise<
  | {
      priceId: string
      customerId: string
      tier: NonNullable<ReturnType<typeof getPlanTier>>
      appOrigin: string
      sessionMetadata: Record<string, string>
      branding: ReturnType<typeof getCheckoutBrandingSettings>
    }
  | { error: string }
> {
  if (!stripe) return { error: getMissingStripeSecretMessage() }

  if (interval === 'year' && !isAnnualBillingEnabled()) {
    return { error: 'Annual billing is not available yet.' }
  }

  const priceId = getStripePriceId(plan, interval)
  if (!priceId) {
    const envHint =
      interval === 'year'
        ? `STRIPE_PRICE_${plan.toUpperCase()}_ANNUAL`
        : `STRIPE_PRICE_${plan.toUpperCase()}_MONTHLY (or legacy STRIPE_PRICE_${plan.toUpperCase()})`
    return {
      error: `No Stripe price configured for ${plan} (${interval}). Add ${envHint} to your environment.`,
    }
  }

  const tier = getPlanTier(plan)
  if (!tier) return { error: `Unknown plan: ${plan}` }

  const customerResult = await ensureStripeCustomer(userId)
  if ('error' in customerResult) return customerResult

  const appOrigin = resolveAppOrigin()
  const brandingDisplayName = tier.brandingDisplayName
  const branding = getCheckoutBrandingSettings(appOrigin, brandingDisplayName)
  const sessionMetadata = buildCheckoutSessionMetadata(plan, userId, interval)

  return {
    priceId,
    customerId: customerResult.customerId,
    tier,
    appOrigin,
    sessionMetadata,
    branding,
  }
}

/**
 * Create a Stripe Checkout session for upgrading to a paid plan.
 * Returns the checkout URL or an error message.
 *
 * Product name/description on hosted Checkout come from Stripe Dashboard Products
 * attached to STRIPE_PRICE_* — see docs/STRIPE_PRODUCT_COPY.md. Session metadata,
 * branding_settings, and custom_text are set here at checkout time.
 */
export async function createCheckoutSession(
  plan: StripePlan
): Promise<{ url: string } | { error: string }> {
  if (!stripe) return { error: getMissingStripeSecretMessage() }

  const { userId } = await auth()
  if (!userId) return { error: 'Not signed in.' }

  if (plan === 'enterprise') {
    return { error: 'Enterprise is custom pricing — contact sales.' }
  }

  const base = await buildSubscriptionCheckoutBase(plan, userId, 'month')
  if ('error' in base) return { error: base.error }

  const { priceId, customerId, tier, appOrigin, sessionMetadata, branding } = base

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appOrigin}/checkout/cancel`,
    metadata: sessionMetadata,
    subscription_data: {
      metadata: sessionMetadata,
      description: tier.checkoutDescription,
    },
    custom_text: tier.checkoutDescription
      ? { submit: { message: tier.checkoutDescription } }
      : undefined,
    // Allow promo codes at checkout (coupon field left empty — LAUNCH_COUPON_ID deprecated)
    allow_promotion_codes: true,
    ...branding,
  })

  if (!session.url) return { error: 'Failed to create checkout session.' }
  return { url: session.url }
}

export async function createEmbeddedCheckoutSession(
  plan: EmbeddedCheckoutPlan,
  interval: BillingInterval = 'month'
): Promise<{ clientSecret: string } | { error: string }> {
  if (!stripe) return { error: getMissingStripeSecretMessage() }

  const { userId } = await auth()
  if (!userId) return { error: 'Not signed in.' }

  const base = await buildSubscriptionCheckoutBase(plan, userId, interval)
  if ('error' in base) return { error: base.error }

  const { priceId, customerId, tier, appOrigin, sessionMetadata, branding } = base

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    return_url: `${appOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    metadata: sessionMetadata,
    subscription_data: {
      metadata: sessionMetadata,
      description: tier.checkoutDescription,
    },
    custom_text: tier.checkoutDescription
      ? {
          submit: {
            message: tier.checkoutDescription,
          },
        }
      : undefined,
    allow_promotion_codes: true,
    ...branding,
  })

  if (!session.client_secret) {
    return { error: 'Failed to create embedded checkout session.' }
  }
  return { clientSecret: session.client_secret }
}

/** Retrieve checkout session plan from Stripe (success page). */
export async function getCheckoutSessionPlan(
  sessionId: string
): Promise<{ plan: StripePlan; planName: string } | { error: string }> {
  if (!stripe) return { error: 'Stripe is not configured.' }

  const { userId } = await auth()
  if (!userId) return { error: 'Not signed in.' }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.metadata?.clerk_user_id !== userId) {
      return { error: 'Session does not belong to this account.' }
    }
    const plan = (session.metadata?.plan ?? 'builder') as StripePlan
    return { plan, planName: PLAN_NAMES[plan] ?? 'ACCESS' }
  } catch {
    return { error: 'Could not load checkout session.' }
  }
}

/**
 * Create a Stripe Customer Portal session so users can manage/cancel their subscription.
 */
export async function createPortalSession(): Promise<{ url: string } | { error: string }> {
  if (!stripe) return { error: getMissingStripeSecretMessage() }

  const { userId } = await auth()
  if (!userId) return { error: 'Not signed in.' }

  const supabase = createSupabaseAdmin()
  if (!supabase) return { error: 'Database not available.' }

  const { data: identity } = await supabase
    .from('access_identities')
    .select('stripe_customer_id')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (!identity?.stripe_customer_id) {
    return { error: 'No Stripe subscription found. Subscribe first.' }
  }

  const appOrigin = resolveAppOrigin()

  const session = await stripe.billingPortal.sessions.create({
    customer: identity.stripe_customer_id,
    return_url: `${appOrigin}/settings/billing`,
  })

  return { url: session.url }
}
