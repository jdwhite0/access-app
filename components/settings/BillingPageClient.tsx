'use client'

import Link from 'next/link'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel } from '@/lib/design-system/components/platform'

const BUILDER_FEATURES = [
  'JYSON cloud intelligence (unlimited chat)',
  'ACCESS companion + terminal',
  'Founder OS blueprint & registry',
  'Systems, projects, agents, offers',
  'Local connector + OpenJarvis tools',
  'Vault scan & sync',
  'Command center access',
  'Priority support',
]

const OPERATOR_FEATURES = [
  'JYSON cloud intelligence',
  'ACCESS companion',
  'Founder OS blueprint',
  'Registry (systems + projects)',
  'Community support',
]

export default function BillingPageClient() {
  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-platform-page--wide">
        <PageHeader
          eyebrow="Settings"
          title="Billing"
          description="Your cloud package, usage, and plan management."
        />

        <div className="access-settings-profile-grid">
          {/* Current plan */}
          <SectionPanel title="Current plan">
            <div className="access-billing-plan-card">
              <div className="access-billing-plan-card__header">
                <div>
                  <p className="access-billing-plan-card__name">Builder</p>
                  <p className="access-billing-plan-card__price">$599 <span>/month</span></p>
                </div>
                <span className="access-ds-badge access-ds-badge--operational">Active</span>
              </div>
              <ul className="access-billing-features">
                {BUILDER_FEATURES.map(f => (
                  <li key={f}><span className="access-billing-check">✓</span>{f}</li>
                ))}
              </ul>
              <div className="access-billing-plan-card__footer">
                <p className="access-platform-meta">Next billing date: —</p>
                <p className="access-platform-meta" style={{ marginTop: 4 }}>
                  Stripe billing integration is being configured. Your plan is active.
                </p>
              </div>
            </div>
          </SectionPanel>

          {/* Upgrade */}
          <SectionPanel title="Plans">
            <p className="access-platform-body" style={{ marginBottom: '20px' }}>
              View the full feature comparison and upgrade options on the plans page.
            </p>
            <Link href="/plans" className="access-settings-btn access-settings-btn--primary">
              View plans & pricing →
            </Link>
          </SectionPanel>

          {/* Usage */}
          <SectionPanel title="Usage this cycle">
            <div className="access-settings-info-grid">
              <div className="access-settings-info-row">
                <span className="access-platform-meta">JYSON conversations</span>
                <span className="access-settings-info-value">Unlimited</span>
              </div>
              <div className="access-settings-info-row">
                <span className="access-platform-meta">Registry objects</span>
                <span className="access-settings-info-value">Unlimited</span>
              </div>
              <div className="access-settings-info-row">
                <span className="access-platform-meta">Local connector</span>
                <span className="access-settings-info-value">Enabled</span>
              </div>
              <div className="access-settings-info-row">
                <span className="access-platform-meta">OpenJarvis tools</span>
                <span className="access-settings-info-value">Enabled</span>
              </div>
            </div>
          </SectionPanel>

          {/* Enterprise */}
          <SectionPanel title="Enterprise">
            <p className="access-platform-body" style={{ marginBottom: '16px' }}>
              Need white-labeling, multi-user access, custom AI persona, or dedicated infrastructure? Enterprise starts at $2,000/month.
            </p>
            <a
              href="mailto:jerry@jdwhite.world?subject=ACCESS Enterprise"
              className="access-settings-btn access-settings-btn--secondary"
            >
              Contact for Enterprise →
            </a>
          </SectionPanel>
        </div>
      </div>
    </AccessAppLayout>
  )
}
