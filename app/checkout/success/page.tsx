import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getCheckoutSessionPlan } from '@/lib/stripe/actions'
import { getPlanTier } from '@/lib/stripe/plans'
import type { StripePlan } from '@/lib/stripe/client'
import { PrimaryButton, SecondaryButton } from '@/lib/design-system/components/platform'

export const metadata = {
  title: 'Welcome — ACCESS',
  description: 'Your ACCESS subscription is active.',
}

type Props = {
  searchParams: Promise<{ session_id?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { userId } = await auth()
  if (!userId) redirect('/?redirect=checkout/success')

  const { session_id: sessionId } = await searchParams
  let plan: StripePlan = 'builder'
  let title = 'Welcome to ACCESS Builder.'

  if (sessionId) {
    const result = await getCheckoutSessionPlan(sessionId)
    if ('plan' in result) {
      plan = result.plan
      const tier = getPlanTier(plan)
      title = tier ? `Welcome to ${tier.title}.` : `Welcome to ${result.planName}.`
    }
  }

  const subtitle =
    plan === 'operator'
      ? 'JYSON is ready to help you organize projects, memory, and next actions in your workspace.'
      : 'JYSON is ready to help you turn your projects, memory, agents, and systems into an operating workspace.'

  const steps =
    plan === 'operator'
      ? [
          'Confirm your profile',
          'Add or review projects',
          'Capture memory and context',
          'Ask JYSON what to do next',
        ]
      : [
          'Confirm your profile',
          'Add or review projects',
          'Connect local tools',
          'Ask JYSON what to do next',
        ]

  return (
    <div className="access-plans-shell">
      <div className="access-shell-page access-checkout-result">
        <p className="access-plans-eyebrow">Subscription active</p>
        <h1 className="access-plans-title">{title}</h1>
        <p className="access-plans-subtitle">{subtitle}</p>

        <ol className="access-checkout-result__steps">
          {steps.map((step, i) => (
            <li key={step}>
              <span className="access-checkout-result__step-num">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>

        <div className="access-checkout-result__actions">
          <PrimaryButton href="/dashboard">Open ACCESS</PrimaryButton>
          <SecondaryButton href="/onboarding">Set up my workspace</SecondaryButton>
        </div>

        <p className="access-platform-meta" style={{ marginTop: 24 }}>
          <Link href="/settings/billing">View billing</Link>
          {' · '}
          <Link href="/companion">Open JYSON</Link>
        </p>
      </div>
    </div>
  )
}
