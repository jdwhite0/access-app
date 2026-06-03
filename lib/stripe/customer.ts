import { createSupabaseAdmin } from '@/lib/supabase'
import { stripe } from './client'

export async function ensureStripeCustomer(
  clerkUserId: string
): Promise<{ customerId: string } | { error: string }> {
  if (!stripe) return { error: 'Stripe is not configured.' }

  const supabase = createSupabaseAdmin()
  if (!supabase) {
    const customer = await stripe.customers.create({
      metadata: { clerk_user_id: clerkUserId },
    })
    return { customerId: customer.id }
  }

  const { data: identity } = await supabase
    .from('access_identities')
    .select('handle')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  const stripeDataResult = await supabase
    .from('access_identities')
    .select('stripe_customer_id')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()
  const stripeData = stripeDataResult.error ? null : stripeDataResult.data

  const existingCustomerId = (stripeData as { stripe_customer_id?: string } | null)?.stripe_customer_id

  if (existingCustomerId) {
    return { customerId: existingCustomerId }
  }

  const customer = await stripe.customers.create({
    metadata: {
      clerk_user_id: clerkUserId,
      access_handle: (identity as { handle?: string } | null)?.handle ?? '',
    },
  })

  await supabase
    .from('access_identities')
    .update({ stripe_customer_id: customer.id } as Record<string, unknown>)
    .eq('clerk_user_id', clerkUserId)
    .then(() => null, () => null)

  return { customerId: customer.id }
}
