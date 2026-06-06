'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import type { UpgradeTrigger } from '@/lib/plans/limits'

const C = {
  bg:      '#FFFFFF',
  bgDark:  '#0A2540',
  text:    '#0A2540',
  textSub: '#425466',
  textMute:'#697386',
  border:  '#E6EBF1',
  accent:  '#0EA5B9',
  green:   '#2D8A6E',
  overlay: 'rgba(10,37,64,0.5)',
} as const

type Props = {
  trigger: UpgradeTrigger | null
  onDismiss: () => void
}

const BUILDER_INCLUDES = [
  'Unlimited projects',
  'CRM (500 contacts)',
  '10 active workflows',
  '5 vaults (50 GB each)',
  'JYSON — 1,000 messages/month + business context',
  'Full registry + blueprints',
  'Offers catalog',
  'Permanent business memory',
]

const ENTERPRISE_INCLUDES = [
  'Everything in Builder',
  '10 team seats ($25/seat after)',
  'JYSON — unlimited + team intelligence',
  'RBAC permissions',
  'Audit logs & compliance tools',
  'REST API access',
  'Dedicated support + SLA',
]

export default function UpgradePromptModal({ trigger, onDismiss }: Props) {
  useEffect(() => {
    if (!trigger) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [trigger, onDismiss])

  if (!trigger) return null

  const isEnterprise = trigger.targetPlan === 'enterprise'
  const includes = isEnterprise ? ENTERPRISE_INCLUDES : BUILDER_INCLUDES
  const price = isEnterprise ? '$299/month' : '$99/month'
  const planHref = isEnterprise ? '/checkout/enterprise' : '/checkout/builder'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.overlay, padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss() }}
    >
      <div style={{
        background: C.bg, borderRadius: 16, padding: '36px 32px',
        maxWidth: 500, width: '100%',
        boxShadow: '0 24px 80px rgba(10,37,64,0.18), 0 4px 12px rgba(10,37,64,0.08)',
        position: 'relative',
      }}>
        {/* Close */}
        <button type="button" onClick={onDismiss} aria-label="Dismiss"
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, color: C.textMute, cursor: 'pointer', lineHeight: 1, padding: 4 }}>
          ×
        </button>

        {/* Feature tag */}
        <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.accent, background: 'rgba(14,165,185,0.08)', padding: '3px 10px', borderRadius: 4, marginBottom: 14 }}>
          {trigger.feature}
        </span>

        <h2 id="upgrade-modal-title" style={{ margin: '0 0 10px', fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
          {trigger.headline}
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 15, color: C.textSub, lineHeight: 1.6 }}>
          {trigger.description}
        </p>

        {/* Plan preview */}
        <div style={{ background: C.bgDark, borderRadius: 10, padding: '20px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              ACCESS {isEnterprise ? 'Enterprise' : 'Builder'}
            </p>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>{price}</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {includes.slice(0, 5).map(item => (
              <li key={item} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                <span style={{ color: C.green, fontWeight: 700, flexShrink: 0 }}>✓</span>
                {item}
              </li>
            ))}
            {includes.length > 5 && (
              <li style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>+{includes.length - 5} more included</li>
            )}
          </ul>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href={planHref}
            style={{ display: 'block', textAlign: 'center', background: C.accent, color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px 20px', borderRadius: 8, textDecoration: 'none', transition: 'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {trigger.ctaLabel}
          </Link>
          <button type="button" onClick={onDismiss}
            style={{ background: 'none', border: `1px solid ${C.border}`, color: C.textMute, fontSize: 14, fontWeight: 500, padding: '12px 20px', borderRadius: 8, cursor: 'pointer' }}>
            Not right now
          </button>
        </div>

        {!isEnterprise && (
          <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: 12, color: C.textMute }}>
            14-day free trial · No credit card required · Cancel anytime
          </p>
        )}
      </div>
    </div>
  )
}
