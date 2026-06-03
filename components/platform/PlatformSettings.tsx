'use client'

import { PageHeader, SecondaryButton } from '@/lib/design-system/components/platform'
import { WORKSPACE_LINKS } from '@/lib/navigation/config'

type SettingsRowProps = {
  title: string
  description: string
  href: string
  actionLabel: string
}

function SettingsRow({ title, description, href, actionLabel }: SettingsRowProps) {
  return (
    <div className="access-settings-row">
      <div className="access-settings-row__body">
        <p className="access-settings-row__title">{title}</p>
        <p className="access-settings-row__desc">{description}</p>
      </div>
      <div className="access-settings-row__action">
        <SecondaryButton href={href}>{actionLabel}</SecondaryButton>
      </div>
    </div>
  )
}

const SECTIONS = [
  {
    title: 'Account',
    lead: 'Profile, sign-in, and security for your ACCESS identity.',
    rows: [
      {
        title: 'Profile',
        description: 'Edit your name, avatar, and how you appear in the workspace.',
        href: '/settings/profile',
        actionLabel: 'Edit profile',
      },
      {
        title: 'Account & security',
        description: 'Sessions, connected accounts, and account deletion.',
        href: '/settings/account',
        actionLabel: 'Manage account',
      },
    ],
  },
  {
    title: 'Billing',
    lead: 'Plan, payment method, invoices, and usage.',
    rows: [
      {
        title: 'Billing',
        description: 'Manage your plan, payment method, invoices, and usage.',
        href: '/settings/billing',
        actionLabel: 'Manage billing',
      },
      {
        title: 'Plans',
        description: 'Compare Operator, Builder, and Enterprise tiers.',
        href: '/plans',
        actionLabel: 'View plans',
      },
    ],
  },
  {
    title: 'Workspace',
    lead: 'Identity and blueprint — use the main menu for Projects, Offers, and Registry.',
    rows: WORKSPACE_LINKS.map((link) => ({
      title: link.label,
      description: link.note,
      href: link.href,
      actionLabel: 'Open',
    })),
  },
  {
    title: 'Integrations',
    lead: 'Companion, local tools, and connected systems.',
    rows: [
      {
        title: 'JYSON',
        description: 'Full intelligence view, diagnostics, and companion settings.',
        href: '/companion',
        actionLabel: 'Open JYSON',
      },
      {
        title: 'Local tools',
        description: 'Connect OpenJarvis and the connector for files, vault, and models on your machine.',
        href: '/companion#diagnostics',
        actionLabel: 'Connect local tools',
      },
    ],
  },
  {
    title: 'Security',
    lead: 'Access control and platform visibility.',
    rows: [
      {
        title: 'Public status',
        description: 'Uptime and incident history for ACCESS services.',
        href: '/status',
        actionLabel: 'View status',
      },
      {
        title: 'Internal status',
        description: 'Operator view of platform health (signed in).',
        href: '/internal/status',
        actionLabel: 'Open internal status',
      },
    ],
  },
  {
    title: 'Developer tools',
    lead: 'Advanced operator surfaces — use when you need full control.',
    rows: [
      {
        title: 'Terminal',
        description: 'Command-line style interface for registry, agents, and scripts.',
        href: '/terminal',
        actionLabel: 'Open terminal',
      },
      {
        title: 'Command Center',
        description: 'Internal orchestration and system registry for operators.',
        href: '/internal/command-center',
        actionLabel: 'Open command center',
      },
    ],
  },
] as const

export default function PlatformSettings() {
  return (
    <div className="access-platform access-platform-page access-shell-page access-shell-page--wide">
      <PageHeader
        title="Settings"
        description="Account, billing, workspace, integrations, and developer tools."
      />
      <div className="access-settings-stripe">
        {SECTIONS.map((section) => (
          <section key={section.title} className="access-settings-stripe__section">
            <h2>{section.title}</h2>
            <p className="access-settings-stripe__lead">{section.lead}</p>
            {section.rows.map((row) => (
              <SettingsRow key={row.title} {...row} />
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
