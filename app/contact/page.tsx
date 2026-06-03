import Link from 'next/link'
import AccessMarketingLayout from '@/components/marketing/AccessMarketingLayout'
import PublicHeader from '@/components/marketing/PublicHeader'
import ContactActions from '@/components/marketing/ContactActions'
import { MarketingCTALink } from '@/components/marketing/MarketingCTA'

export const metadata = {
  title: 'Contact — ACCESS',
  description: 'Questions about ACCESS, plans, or working together — we are happy to hear from you.',
}

const CONTACT_MAIL =
  'mailto:jerry@jdwhite.world?subject=ACCESS%20—%20Get%20in%20touch'

export default function ContactPage() {
  return (
    <AccessMarketingLayout>
      <PublicHeader />
      <div className="access-mkt-contact">
        <p className="access-mkt-contact__eyebrow">Contact</p>
        <h1 className="access-mkt-contact__title">Talk with us</h1>
        <p className="access-mkt-contact__lead">
          Whether you are exploring ACCESS for the first time or bringing your team aboard — we
          are glad to help. Ask about plans, getting started, or working together. No pressure,
          just a clear conversation.
        </p>
        <div className="access-mkt-contact__actions">
          <ContactActions />
          <a href={CONTACT_MAIL} className="access-mkt-cta access-mkt-cta--secondary">
            Email directly
          </a>
          <MarketingCTALink href="/" variant="secondary">
            ← Back to home
          </MarketingCTALink>
        </div>
      </div>
    </AccessMarketingLayout>
  )
}
