'use client'

import { useMarketingAuthActions } from '@/components/marketing/useMarketingAuthActions'
import { MarketingCTAButton, MarketingCTALink } from '@/components/marketing/MarketingCTA'

export default function ContactActions() {
  const { startBuilding } = useMarketingAuthActions()

  return (
    <>
      <MarketingCTAButton variant="accent" onClick={startBuilding}>
        Get started
      </MarketingCTAButton>
      <MarketingCTALink href="/plans" variant="primary">
        View plans
      </MarketingCTALink>
    </>
  )
}
