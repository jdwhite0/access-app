'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { stripe, PLAN_PRICE_MAP, type StripePlan } from './client'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

/**
 * Create a Stripe Checkout session for upgrading to a paid plan.
 * Returns the checkout URL or an error message.
 */
export async function createCheckoutSession(
  plan: StripePlan
): Promise<{ url: string } | { error: string }> {
  if (!stripe) return { error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment.' }

  const { userId } = await auth()
  if (!userId) return { error: 'Not signed in.' }

  const priceId = PLAN_PRICE_MAP[plan]
  if (!priceId) return { error: `No Stripe price configured for plan: ${plan}. Add STRIPE_PRICE_${plan.toUpperCase()} to your environment.` }

  // Look up or create a Stripe customer for this user
  const supabase = createSupabaseAdmin()
  let customerId: string | undefined

  if (supabase) {
    const { data: identity } = await supabase
      .from('access_identities')
      .select('handle')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    // Try to fetch stripe_customer_id separately in case column doesn't exist yet
    const stripeDataResult = await supabase
      .from('access_identities')
      .select('stripe_customer_id')
      .eq('clerk_user_id', userId)
      .maybeSingle()
    const stripeData = stripeDataResult.error ? null : stripeDataResult.data

    const existingCustomerId = (stripeData as { stripe_customer_id?: string } | null)?.stripe_customer_id

    if (existingCustomerId) {
      customerId = existingCustomerId
    } else {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        metadata: { clerk_user_id: userId, access_handle: (identity as { handle?: string } | null)?.handle ?? '' },
      })
      customerId = customer.id

      // Save to DB — ignore error if stripe_customer_id column doesn't exist yet
      await supabase
        .from('access_identities')
        .update({ stripe_customer_id: customer.id } as Record<string, unknown>)
        .eq('clerk_user_id', userId)
        .then(() => null, () => null)
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/settings/billing?success=1`,
    cancel_url: `${APP_URL}/settings/billing?canceled=1`,
    metadata: { clerk_user_id: userId, plan },
    subscription_data: {
      metadata: { clerk_user_id: userId, plan },
    },
    allow_promotion_codes: true,
  })

  if (!session.url) return { error: 'Failed to create checkout session.' }
  return { url: session.url }
}

/**
 * Create a Stripe Customer Portal session so users can manage/cancel their subscription.
 */
export async function createPortalSession(): Promise<{ url: string } | { error: string }> {
  if (!stripe) return { error: 'Stripe is not configured.' }

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

  const session = await stripe.billingPortal.sessions.create({
    customer: identity.stripe_customer_id,
    return_url: `${APP_URL}/settings/billing`,
  })

  return { url: session.url }
}
