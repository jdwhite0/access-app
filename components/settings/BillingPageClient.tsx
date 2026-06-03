'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { PageHeader, SectionPanel } from '@/lib/design-system/components/platform'

/** Founder account — hardcoded until schema_v5_billing.sql is applied and plan column is live */
const FOUNDER_HANDLES = ['jdwhite']

const FOUNDER_FEATURES = [
  'JYSON cloud intelligence (unlimited, forever)',
  'ACCESS companion + terminal',
  'Full Founder OS — blueprint, registry, all objects',
  'Local connector + OpenJarvis tools',
  'Admin access to all operator surfaces',
  'No usage limits, no billing, no expiration',
]

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
  const { user } = useUser()
  const username = user?.username ?? ''
  const isFounder = FOUNDER_HANDLES.includes(username.toLowerCase())

  return (
    <AccessAppLayout variant="default">
      <div className="access-platform access-platform-page access-platform-page--wide">
        <PageHeader
          eyebrow="Settings"
          title="Billing"
          description={isFounder ? 'Founder account — lifetime access, no billing required.' : 'Your cloud package, usage, and plan management.'}
        />

        <div className="access-settings-profile-grid">
          {/* Current plan */}
          <SectionPanel title="Current plan">
            <div className="access-billing-plan-card" style={isFounder ? { borderColor: 'rgba(201,164,106,0.35)', background: 'rgba(201,164,106,0.03)' } : {}}>
              <div className="access-billing-plan-card__header">
                <div>
                  <p className="access-billing-plan-card__name" style={isFounder ? { color: 'var(--gold, #c9a46a)' } : {}}>
                    {isFounder ? 'Founder' : 'Builder'}
                  </p>
                  <p className="access-billing-plan-card__price" style={isFounder ? { color: 'var(--gold, #c9a46a)', fontSize: '20px' } : {}}>
                    {isFounder ? 'Lifetime · No charge' : '$599 '}{!isFounder && <span>/month</span>}
                  </p>
                </div>
                <span className={`access-ds-badge access-ds-badge--${isFounder ? 'info' : 'operational'}`}>
                  {isFounder ? 'Founder' : 'Active'}
                </span>
              </div>
              <ul className="access-billing-features">
                {(isFounder ? FOUNDER_FEATURES : BUILDER_FEATURES).map(f => (
                  <li key={f}><span className="access-billing-check">✓</span>{f}</li>
                ))}
              </ul>
              <div className="access-billing-plan-card__footer">
                {isFounder ? (
                  <p className="access-platform-meta">
                    This is the founder account. Full access, no billing, no expiration. You may still delete this account from Settings → Account at any time.
                  </p>
                ) : (
                  <>
                    <p className="access-platform-meta">Next billing date: —</p>
                    <p className="access-platform-meta" style={{ marginTop: 4 }}>
                      Stripe billing integration is being configured. Your plan is active.
                    </p>
                  </>
                )}
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
