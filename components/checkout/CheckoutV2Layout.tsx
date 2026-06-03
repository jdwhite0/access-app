import Link from 'next/link'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  summary: ReactNode
}

export default function CheckoutV2Layout({ children, summary }: Props) {
  return (
    <div className="access-checkout-v2">
      <div className="access-checkout-v2__inner">
        <Link href="/plans" className="access-checkout-v2__back">
          ← Plans
        </Link>
        <div className="access-checkout-v2__grid">
          {summary}
          <div className="access-checkout-v2__payment">{children}</div>
        </div>
      </div>
    </div>
  )
}
