import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createSupabaseAdmin } from '@/lib/supabase'
import type Stripe from 'stripe'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

/**
 * Stripe webhook handler.
 * Events handled:
 *   checkout.session.completed  → activate plan in DB
 *   customer.subscription.updated → update plan
 *   customer.subscription.deleted → downgrade to free
 */
export async function POST(req: NextRequest) {
  if (!stripe || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET)
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature failed: ${String(err)}` }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const clerkUserId = session.metadata?.clerk_user_id
        const plan = session.metadata?.plan
        if (clerkUserId && plan) {
          await supabase
            .from('access_identities')
            .update({ plan, stripe_customer_id: session.customer as string })
            .eq('clerk_user_id', clerkUserId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const clerkUserId = sub.metadata?.clerk_user_id
        const plan = sub.metadata?.plan
        if (clerkUserId && plan) {
          const status = sub.status === 'active' || sub.status === 'trialing' ? plan : 'free'
          await supabase
            .from('access_identities')
            .update({ plan: status })
            .eq('clerk_user_id', clerkUserId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const clerkUserId = sub.metadata?.clerk_user_id
        if (clerkUserId) {
          await supabase
            .from('access_identities')
            .update({ plan: 'free' })
            .eq('clerk_user_id', clerkUserId)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[stripe webhook]', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
