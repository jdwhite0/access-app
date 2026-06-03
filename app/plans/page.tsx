import PlansPageClient from '@/components/platform/PlansPageClient'
import { isAnnualBillingEnabled } from '@/lib/stripe/prices'

/** Read Stripe price env at request time — avoid baking annual toggle off at static build. */
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Plans — ACCESS',
  description:
    'Choose how you build with ACCESS — Operator and Builder plans with monthly flexibility or annual commitment.',
}

export default function PlansPage() {
  return <PlansPageClient annualBillingEnabled={isAnnualBillingEnabled()} />
}
