import LegalDocumentLayout from '@/components/legal/LegalDocumentLayout'

export const metadata = {
  title: 'Privacy Policy — ACCESS',
  description: 'How ACCESS and JD AI Systems handle your data.',
}

export default function PrivacyPage() {
  return (
    <LegalDocumentLayout title="Privacy Policy">
      <p><em>Last updated: June 2026. Replace with counsel-reviewed policy before production.</em></p>
      <p>
        ACCESS (&quot;we&quot;, &quot;JD AI Systems&quot;) processes account data to provide workspace intelligence,
        billing, connector sync, and optional marketing communications you opt into.
      </p>
      <h2>Data we collect</h2>
      <ul>
        <li>Account identity (Clerk), ACCESS handle, and workspace registry data</li>
        <li>Email address for authentication, transactional notices, and optional intelligence emails</li>
        <li>Email preference and consent logs for compliance</li>
        <li>Connector and vault metadata required for sync</li>
      </ul>
      <h2>Marketing email</h2>
      <p>
        Marketing and ACCESS Intelligence emails are optional. You may unsubscribe via any marketing email
        or manage preferences in Settings → Notifications & Email.
      </p>
      <h2>Contact</h2>
      <p>For privacy requests, contact support through your ACCESS workspace or jd.ai systems channels.</p>
    </LegalDocumentLayout>
  )
}
