import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import CheckoutPageClient from '@/components/checkout/CheckoutPageClient'
import type { EmbeddedCheckoutPlan } from '@/lib/stripe/actions'
import { getPlanTier } from '@/lib/stripe/plans'
import { isAnnualBillingEnabled, type BillingInterval } from '@/lib/stripe/prices'

const VALID_PLANS: EmbeddedCheckoutPlan[] = ['operator', 'builder']

const ENTERPRISE_MAIL =
  'mailto:jerry@jdwhite.world?subject=ACCESS%20Enterprise'

type Props = {
  params: Promise<{ plan: string }>
  searchParams: Promise<{ interval?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { plan } = await params
  const tier = getPlanTier(plan as EmbeddedCheckoutPlan)
  return {
    title: tier ? `Checkout — ${tier.title}` : 'Checkout — ACCESS',
    description: tier?.checkoutDescription ?? 'Activate your ACCESS subscription.',
  }
}

export default async function CheckoutPlanPage({ params, searchParams }: Props) {
  const { plan } = await params
  const { interval: rawInterval } = await searchParams
  let interval: BillingInterval = rawInterval === 'year' ? 'year' : 'month'
  if (interval === 'year' && !isAnnualBillingEnabled()) {
    interval = 'month'
  }

  if (plan === 'enterprise') {
    redirect(ENTERPRISE_MAIL)
  }

  if (!VALID_PLANS.includes(plan as EmbeddedCheckoutPlan)) {
    notFound()
  }

  const { userId } = await auth()
  if (!userId) {
    redirect(`/?redirect=/checkout/${plan}`)
  }

  return (
    <CheckoutPageClient
      plan={plan as EmbeddedCheckoutPlan}
      interval={interval}
    />
  )
}
