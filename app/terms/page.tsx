import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout'

export const metadata = {
  title: 'Terms of Service — ACCESS',
  description: 'Terms governing use of the ACCESS platform.',
}

export default function TermsPage() {
  return (
    <LegalDocumentLayout title="Terms of Service">
      <p><em>Last updated: June 2026. Replace with counsel-reviewed terms before production.</em></p>
      <p>
        By using ACCESS, you agree to these terms and our Privacy Policy. ACCESS is operated by JD AI Systems.
      </p>
      <h2>Service</h2>
      <p>
        ACCESS provides workspace intelligence, registry tools, connectors, and optional email communications.
        Features may change; transactional notices related to security and billing may be sent as required.
      </p>
      <h2>Accounts</h2>
      <p>You are responsible for safeguarding your sign-in credentials and connector tokens.</p>
      <h2>Email</h2>
      <p>
        Required account emails cannot be disabled. Marketing emails require consent where applicable and include
        unsubscribe mechanisms per applicable law.
      </p>
    </LegalDocumentLayout>
  )
}
