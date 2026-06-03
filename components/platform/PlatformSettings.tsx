'use client'

import Link from 'next/link'
import { PageHeader } from '@/lib/design-system/components/platform'

const SECTIONS = [
  {
    title: 'Account & identity',
    items: [
      { label: 'Profile', href: '/settings/profile', note: 'Edit your name, avatar, and display identity' },
      { label: 'Account & security', href: '/settings/account', note: 'Sessions, connected accounts, delete account' },
      { label: 'ACCESS handle', href: '/registry', note: 'Registry identity layer' },
    ],
  },
  {
    title: 'Billing',
    items: [
      { label: 'Billing & plan', href: '/settings/billing', note: 'Current plan, usage, and upgrade' },
      { label: 'View all plans', href: '/plans', note: 'Operator · Builder · Enterprise' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { label: 'Founder OS', href: '/founder' },
      { label: 'JYSON companion', href: '/companion' },
      { label: 'Local connector', href: '/companion#jyson', note: 'OpenJarvis + connector heartbeat' },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { label: 'Projects', href: '/projects' },
      { label: 'Agents', href: '/agents' },
      { label: 'Offers', href: '/offers' },
      { label: 'Memory', href: '/memory' },
    ],
  },
  {
    title: 'Operator & developer',
    items: [
      { label: 'Terminal (advanced)', href: '/terminal' },
      { label: 'Command Center', href: '/internal/command-center' },
      { label: 'Internal status', href: '/internal/status' },
      { label: 'Public status', href: '/status' },
    ],
  },
] as const

export default function PlatformSettings() {
  return (
    <div className="access-platform access-platform-page access-platform-page--wide">
      <PageHeader
        eyebrow="ACCESS"
        title="Settings"
        description="Account, billing, integrations, and operator tools."
      />
      <div className="access-settings-grid">
        {SECTIONS.map((section) => (
          <section key={section.title} className="access-settings-section">
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link href={item.href}>{item.label}</Link>
                  {'note' in item && item.note ? (
                    <span className="access-platform-meta" style={{ display: 'block', marginTop: 4 }}>
                      {item.note}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
