import Link from 'next/link'
import { PrimaryButton, SecondaryButton } from '@/lib/design-system/components/platform'

export const metadata = {
  title: 'Checkout canceled — ACCESS',
  description: 'Return to plans when you are ready.',
}

export default function CheckoutCancelPage() {
  return (
    <div className="access-plans-shell">
      <div className="access-shell-page access-checkout-result">
        <p className="access-plans-eyebrow">Checkout</p>
        <h1 className="access-plans-title">No problem — your ACCESS plan is still here.</h1>
        <p className="access-plans-subtitle">
          You can return anytime when you&apos;re ready to activate JYSON, projects, memory, agents,
          and workspace intelligence.
        </p>

        <div className="access-checkout-result__actions">
          <PrimaryButton href="/plans">Return to plans</PrimaryButton>
          <SecondaryButton href="/companion?prompt=Which%20ACCESS%20plan%20fits%20me%3F">
            Ask JYSON which plan fits me
          </SecondaryButton>
        </div>

        <p className="access-platform-meta" style={{ marginTop: 24 }}>
          <Link href="/dashboard">Back to Home</Link>
        </p>
      </div>
    </div>
  )
}
