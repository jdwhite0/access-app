import Link from 'next/link'
import type { ReactNode } from 'react'

type Props = {
  title: string
  children: ReactNode
}

export default function LegalDocumentLayout({ title, children }: Props) {
  return (
    <div className="access-legal-page">
      <div className="access-legal-card access-legal-card--wide">
        <p className="access-legal-eyebrow">ACCESS · JD AI Systems</p>
        <h1>{title}</h1>
        <div className="access-legal-body">{children}</div>
        <p className="access-legal-footer-links">
          <Link href="/terms">Terms of Service</Link>
          {' · '}
          <Link href="/privacy">Privacy Policy</Link>
          {' · '}
          <Link href="/email-preferences">Email preferences</Link>
          {' · '}
          <Link href="/settings/notifications-email">Notification settings</Link>
        </p>
      </div>
    </div>
  )
}
