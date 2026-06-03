'use client'

import Link from 'next/link'
import { useMarketingAuthActions } from '@/components/marketing/useMarketingAuthActions'
import { MarketingCTALink } from '@/components/marketing/MarketingCTA'

const NAV = [
  { label: 'Product', href: '/#how-it-works' },
  { label: 'How it works', href: '/#capability' },
  { label: 'Help', href: '/#help-support' },
  { label: 'Pricing', href: '/plans' },
] as const

export default function PublicHeader() {
  const { dashboardHref, handleDashboardClick } = useMarketingAuthActions()

  return (
    <header className="access-mkt-header">
      <div className="access-mkt-header__inner">
        <Link href="/" className="access-mkt-header__wordmark">
          ACCESS
        </Link>
        <nav className="access-mkt-header__nav" aria-label="Primary">
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} className="access-mkt-header__nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="access-mkt-header__actions">
          <Link
            href={dashboardHref}
            className="access-mkt-header__text-link"
            onClick={handleDashboardClick}
          >
            Dashboard
          </Link>
          <MarketingCTALink href="/contact" variant="primary">
            Talk with us
          </MarketingCTALink>
        </div>
      </div>
    </header>
  )
}
