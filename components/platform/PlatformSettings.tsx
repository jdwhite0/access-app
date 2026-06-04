'use client'

import { useState } from 'react'
import { PageHeader, SecondaryButton } from '@/lib/design-system/components/platform'
import { WORKSPACE_LINKS } from '@/lib/navigation/config'
import { useDensity, DENSITY_LABELS, type DensityMode } from '@/lib/design-system/density/DensityProvider'

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

function DensityControl() {
  const { density, setDensity } = useDensity()
  const [saved, setSaved] = useState<DensityMode | null>(null)
  const modes: DensityMode[] = ['comfortable', 'more-space', 'larger-text']

  function handleSelect(mode: DensityMode) {
    setDensity(mode)
    setSaved(mode)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Display scale</p>
        {saved && (
          <span style={{
            fontSize: 11, color: 'var(--success)', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            ✓ Applied
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>
        Changes apply instantly and are saved for your next visit.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {modes.map((mode) => {
          const active = density === mode
          const { title, desc } = DENSITY_LABELS[mode]
          return (
            <button
              key={mode}
              onClick={() => handleSelect(mode)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: 3, padding: '10px 14px', borderRadius: 7, cursor: 'pointer',
                border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent-glow)' : 'transparent',
                minWidth: 140, transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text)' }}>{title}</span>
                {active && <span style={{ fontSize: 10, color: 'var(--accent)' }}>●</span>}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, textAlign: 'left' }}>{desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const SECTIONS = [
  {
    title: 'Account',
    lead: 'Profile, sign-in, and security for your ACCESS identity.',
    rows: [
      { title: 'Profile', description: 'Edit your name, avatar, and how you appear in the workspace.', href: '/settings/profile', actionLabel: 'Edit profile' },
      { title: 'Account & security', description: 'Sessions, connected accounts, and account deletion.', href: '/settings/account', actionLabel: 'Manage account' },
      { title: 'Notifications & Email', description: 'Required account emails and optional ACCESS Intelligence preferences.', href: '/settings/notifications-email', actionLabel: 'Manage notifications' },
    ],
  },
  {
    title: 'Billing',
    lead: 'Plan, payment method, invoices, and usage.',
    rows: [
      { title: 'Billing', description: 'Manage your plan, payment method, invoices, and usage.', href: '/settings/billing', actionLabel: 'Manage billing' },
      { title: 'Plans', description: 'Compare Operator, Builder, and Enterprise tiers.', href: '/plans', actionLabel: 'View plans' },
    ],
  },
  {
    title: 'Workspace',
    lead: 'Identity and blueprint — use the main menu for Projects, Offers, and Systems.',
    rows: WORKSPACE_LINKS.map((link) => ({
      title: link.label,
      description: link.note,
      href: link.href,
      actionLabel: 'Open',
    })),
  },
  {
    title: 'Integrations',
    lead: 'Intelligence, personalization, local tools, and connected systems.',
    rows: [
      { title: 'Intelligence (JYSON)', description: 'Full AI view, diagnostics, and companion settings.', href: '/companion', actionLabel: 'Open Intelligence' },
      { title: 'AI personalization', description: 'Rename your AI, set its role, tone, and purpose.', href: '/settings/intelligence', actionLabel: 'Personalize AI' },
      { title: 'Local capabilities', description: 'Enable JYSON local intelligence on this Mac — files, vault depth, and future local layers.', href: '/agents?connect=tools#execution', actionLabel: 'Set up on this Mac' },
    ],
  },
  {
    title: 'Security',
    lead: 'Access control and platform visibility.',
    rows: [
      { title: 'Public status', description: 'Uptime and incident history for ACCESS services.', href: '/status', actionLabel: 'View status' },
      { title: 'Internal status', description: 'Operator view of platform health (signed in).', href: '/internal/status', actionLabel: 'Open internal status' },
    ],
  },
  {
    title: 'Developer tools',
    lead: 'Advanced operator surfaces — use when you need full control.',
    rows: [
      { title: 'Terminal', description: 'Command-line interface for registry, agents, and scripts.', href: '/terminal', actionLabel: 'Open terminal' },
      { title: 'Command Center', description: 'Internal orchestration and system registry.', href: '/internal/command-center', actionLabel: 'Open command center' },
    ],
  },
] as const

export default function PlatformSettings() {
  return (
    <div className="access-platform access-platform-page access-shell-page access-shell-page--wide">
      <PageHeader
        title="Platform"
        description="Account, billing, workspace, integrations, display, and developer tools."
      />
      <div className="access-settings-stripe">

        {/* Appearance — density control */}
        <section className="access-settings-stripe__section">
          <h2>Appearance</h2>
          <p className="access-settings-stripe__lead">Customize how ACCESS looks and how much it shows on screen.</p>
          <DensityControl />
        </section>

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
