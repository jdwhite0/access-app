import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Email preferences — ACCESS',
  description: 'Manage ACCESS Intelligence and marketing email preferences.',
}

export default async function EmailPreferencesPage() {
  const { userId } = await auth()
  if (userId) {
    redirect('/settings/notifications-email')
  }

  return (
    <div className="access-legal-page">
      <div className="access-legal-card">
        <p className="access-legal-eyebrow">ACCESS</p>
        <h1>Email preferences</h1>
        <p className="access-legal-lead">
          Sign in to manage notification toggles, frequency, and ACCESS Intelligence emails.
        </p>
        <p className="access-legal-lead">
          Received a marketing email? Use the <strong>Unsubscribe</strong> link in that message — no sign-in required.
        </p>
        <div className="access-legal-actions">
          <Link href="/sign-in?redirect_url=%2Fsettings%2Fnotifications-email" className="access-settings-btn access-settings-btn--primary">
            Sign in to manage preferences
          </Link>
          <Link href="/sign-up" className="access-settings-btn access-settings-btn--secondary">
            Create account
          </Link>
        </div>
        <p className="access-legal-footer-links" style={{ marginTop: 24 }}>
          <Link href="/privacy">Privacy Policy</Link>
          {' · '}
          <Link href="/terms">Terms of Service</Link>
        </p>
      </div>
    </div>
  )
}
