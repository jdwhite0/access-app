'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  PLAN_TIERS,
  getPlanBadges,
  getPlanCta,
  getPlanDisplayPricing,
  type PlanTierConfig,
} from '@/lib/stripe/plans'
import type { BillingInterval } from '@/lib/stripe/prices'
import { PrimaryButton, SecondaryButton } from '@/lib/design-system/components/platform'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:         '#FFFFFF',
  bgAlt:      '#F7F9FC',
  bgDark:     '#0A2540',
  text:       '#0A2540',
  textSub:    '#425466',
  textMute:   '#697386',
  border:     '#E6EBF1',
  accent:     '#0EA5B9',
  accentSoft: 'rgba(14,165,185,0.08)',
  green:      '#2D8A6E',
  greenSoft:  'rgba(45,138,110,0.1)',
  gold:       '#9A7B4F',
  goldSoft:   'rgba(154,123,79,0.08)',
} as const

// ─── Full feature comparison matrix ──────────────────────────────────────────
const COMPARE_SECTIONS = [
  {
    label: 'Core Workspace',
    rows: [
      { feature: 'Registry objects',       personal: '25 max',            builder: 'Unlimited',              enterprise: 'Unlimited' },
      { feature: 'Active projects',         personal: '3 max',             builder: 'Unlimited',              enterprise: 'Unlimited' },
      { feature: 'Asset storage',           personal: '5 GB',              builder: '100 GB',                 enterprise: '1 TB' },
      { feature: 'Vaults',                  personal: '1 vault',           builder: '5 vaults (50 GB each)',  enterprise: 'Unlimited' },
      { feature: 'Knowledge base',          personal: 'Personal',          builder: 'Full',                   enterprise: 'Multi-user' },
      { feature: 'Blueprints',              personal: false,               builder: true,                     enterprise: true },
    ],
  },
  {
    label: 'JYSON Intelligence',
    rows: [
      { feature: 'Messages per month',      personal: '100',               builder: '1,000',                  enterprise: 'Unlimited' },
      { feature: 'Memory retention',        personal: '30 days',           builder: 'Permanent',              enterprise: 'Permanent' },
      { feature: 'Business context',        personal: false,               builder: true,                     enterprise: true },
      { feature: 'Cross-module intelligence', personal: false,             builder: true,                     enterprise: true },
      { feature: 'Team intelligence',       personal: false,               builder: false,                    enterprise: true },
      { feature: 'Monthly auto-summaries',  personal: false,               builder: true,                     enterprise: true },
      { feature: 'Object creation via terminal', personal: false,          builder: true,                     enterprise: true },
      { feature: 'API access to JYSON',     personal: false,               builder: false,                    enterprise: true },
    ],
  },
  {
    label: 'Business Operations',
    rows: [
      { feature: 'CRM contacts',            personal: false,               builder: '500 contacts',           enterprise: 'Unlimited' },
      { feature: 'Offers catalog',          personal: false,               builder: true,                     enterprise: true },
      { feature: 'Workflows / automations', personal: false,               builder: '10 active',              enterprise: 'Unlimited' },
      { feature: 'Systems builder',         personal: 'Read-only',         builder: 'Full',                   enterprise: 'Full + versioning' },
      { feature: 'Integrations',            personal: false,               builder: 'Core (Zapier, Slack, Google)', enterprise: 'All + custom webhooks' },
    ],
  },
  {
    label: 'Team & Enterprise',
    rows: [
      { feature: 'Team seats',              personal: '1 seat',            builder: '1 seat',                 enterprise: '10 seats ($25/seat after)' },
      { feature: 'RBAC permissions',        personal: false,               builder: false,                    enterprise: true },
      { feature: 'Audit logs',              personal: false,               builder: false,                    enterprise: true },
      { feature: 'Compliance tools',        personal: false,               builder: false,                    enterprise: true },
      { feature: 'Advanced analytics',      personal: false,               builder: false,                    enterprise: true },
      { feature: 'REST API access',         personal: false,               builder: false,                    enterprise: true },
      { feature: 'SLA (99.9% uptime)',      personal: false,               builder: false,                    enterprise: true },
    ],
  },
  {
    label: 'Support',
    rows: [
      { feature: 'Email support',           personal: '72-hr response',    builder: '48-hr priority',         enterprise: '4-hr + dedicated Slack' },
      { feature: 'Onboarding call',         personal: false,               builder: false,                    enterprise: true },
      { feature: 'Quarterly review',        personal: false,               builder: false,                    enterprise: true },
    ],
  },
]

// ─── Competitors ──────────────────────────────────────────────────────────────
const COMPETITORS = [
  { name: 'Notion',         price: '$8–$16/user/mo',   cat: 'Docs + wiki',        gap: 'Great for notes. No registry, no CRM, no JYSON. No ownership layer.' },
  { name: 'ClickUp',        price: '$7–$12/user/mo',   cat: 'Task management',    gap: 'Broad but shallow. No intelligence layer. No vault or ownership.' },
  { name: 'Monday',         price: '$9–$16/user/mo',   cat: 'Project tracking',   gap: 'Good for teams. No AI that knows your business. No identity layer.' },
  { name: 'HubSpot',        price: '$15–$3,600/mo',    cat: 'CRM only',           gap: 'Great CRM. Doesn\'t know your projects, assets, or systems. 10x the cost.' },
  { name: 'ChatGPT Teams',  price: '$25/user/mo',      cat: 'General AI',         gap: 'Answers questions but doesn\'t know your business. No memory. No registry.' },
  { name: 'Claude Teams',   price: '$30/user/mo',      cat: 'General AI',         gap: 'Same problem. JYSON knows your projects, assets, and history. These don\'t.' },
]

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'What happens after my 14-day Builder trial?', a: 'If you add a payment method, you continue on Builder at $99/month. If you don\'t, your data is preserved in read-only mode under Personal limits. You can subscribe anytime.' },
  { q: 'Can I pay with a bank transfer instead of a card?', a: 'Yes. ACH bank transfer is available at checkout for US bank accounts on Builder and Enterprise plans. Select "Bank Transfer" at checkout.' },
  { q: 'What is JYSON?', a: 'JYSON is the intelligence layer inside ACCESS. Unlike a generic AI chatbot, JYSON knows your projects, assets, customers, systems, and history. It surfaces insights, automates tasks, and helps you run your operation.' },
  { q: 'What\'s the difference between Personal and Builder?', a: 'Personal is for organizing your world (3 projects, 1 vault, 100 JYSON messages). Builder is for running a business — unlimited projects, CRM, workflows, full JYSON business intelligence, and 5 vaults.' },
  { q: 'Is ACCESS right for nonprofits and churches?', a: 'Yes. Builder at $99/month replaces the 4-5 tools these organizations typically use. Registry + Projects + CRM + JYSON in one place.' },
  { q: 'Do you offer refunds?', a: 'If you\'re not satisfied within your first 7 days of a paid subscription, contact us and we\'ll make it right. Annual plans have a 30-day refund window.' },
  { q: 'Can I upgrade or downgrade anytime?', a: 'Yes. Upgrades are immediate. Downgrades take effect at the end of your billing period. Your data is always preserved.' },
  { q: 'What happens to my data if I cancel?', a: 'Your data is preserved in read-only mode for 90 days after cancellation. You can export everything before it expires.' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return `$${n.toLocaleString('en-US')}` }
function href(plan: 'personal' | 'builder', iv: BillingInterval) { return `/checkout/${plan}?interval=${iv}` }

// ─── Comparison cell ──────────────────────────────────────────────────────────
function Cell({ value }: { value: string | boolean }) {
  const base: React.CSSProperties = {
    padding: '11px 16px', fontSize: 13, borderBottom: `1px solid ${C.border}`,
    verticalAlign: 'middle', textAlign: 'center', color: C.textSub,
  }
  if (value === true)  return <td style={base}><span style={{ color: C.green, fontWeight: 700 }}>✓</span></td>
  if (value === false) return <td style={{ ...base, color: C.border }}>—</td>
  return <td style={base}>{value}</td>
}

// ─── FAQ accordion item ───────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '18px 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 15, fontWeight: 500, color: C.text, lineHeight: 1.45 }}>
        <span>{q}</span>
        <span style={{ fontSize: 18, color: C.textMute, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>+</span>
      </button>
      {open && <p style={{ margin: '0 0 18px', fontSize: 14, color: C.textSub, lineHeight: 1.65 }}>{a}</p>}
    </div>
  )
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({ tier, interval, annualEnabled }: {
  tier: PlanTierConfig
  interval: BillingInterval
  annualEnabled: boolean
}) {
  const isEnt      = tier.id === 'enterprise'
  const isPersonal = tier.id === 'personal' || tier.id === 'operator'
  const isFeatured = tier.highlight
  const badges     = getPlanBadges(tier.id, interval)
  const annualNA   = interval === 'year' && !annualEnabled

  const cardStyle: React.CSSProperties = {
    background: isFeatured ? C.bgDark : C.bg,
    border: `1px solid ${isFeatured ? 'rgba(14,165,185,0.3)' : C.border}`,
    borderRadius: 16, padding: '32px 28px',
    display: 'flex', flexDirection: 'column', gap: 0,
    boxShadow: isFeatured
      ? '0 8px 40px rgba(14,165,185,0.15), 0 2px 8px rgba(10,37,64,0.12)'
      : '0 1px 3px rgba(26,31,54,0.05), 0 4px 20px rgba(26,31,54,0.06)',
    position: 'relative', overflow: 'hidden',
  }
  const txtColor   = isFeatured ? 'rgba(255,255,255,0.95)' : C.text
  const muteColor  = isFeatured ? 'rgba(255,255,255,0.55)' : C.textMute
  const checkColor = isFeatured ? C.accent : C.green

  const paidPlan = isPersonal ? 'personal' : (isEnt ? null : 'builder')
  const pricing  = paidPlan ? getPlanDisplayPricing(paidPlan, interval) : null
  const monthlyAmt = pricing ? (interval === 'month' ? pricing.amount : (pricing.equivalentMonthly ?? pricing.amount)) : (isEnt ? 299 : 0)
  return (
    <article style={cardStyle}>
      {isFeatured && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #0EA5B9, #2D8A6E)' }} />}

      {badges.length > 0 ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {badges.map(b => {
            const pop = b === 'MOST POPULAR'
            return (
              <span key={b} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, color: pop ? '#fff' : muteColor, background: pop ? C.accent : (isFeatured ? 'rgba(255,255,255,0.1)' : C.accentSoft) }}>{b}</span>
            )
          })}
        </div>
      ) : <div style={{ height: 32 }} />}

      <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: muteColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{tier.shortName}</p>

      {isEnt ? (
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em', color: C.text }}>$299</span>
          <span style={{ fontSize: 15, color: C.textMute, marginLeft: 4 }}>/month</span>
        </div>
      ) : pricing ? (
        <>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em', color: txtColor }}>{fmt(pricing.amount)}</span>
            <span style={{ fontSize: 15, color: muteColor, marginLeft: 4 }}>{pricing.periodLabel}</span>
          </div>
          {interval === 'year' && pricing.equivalentMonthly && (
            <p style={{ margin: '0 0 2px', fontSize: 13, color: muteColor }}>{fmt(pricing.equivalentMonthly)}/month equivalent</p>
          )}
          {pricing.savingsLabel && (
            <p style={{ margin: '0 0 4px', fontSize: 12, color: checkColor, fontWeight: 600 }}>{pricing.savingsLabel}</p>
          )}
        </>
      ) : null}


      <p style={{ margin: '12px 0 24px', fontSize: 14, color: muteColor, lineHeight: 1.55 }}>{tier.subtitle}</p>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {tier.includes.map(item => (
          <li key={item} style={{ display: 'flex', gap: 10, fontSize: 14, color: txtColor }}>
            <span style={{ color: checkColor, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
            {item}
          </li>
        ))}
      </ul>

      {isEnt ? (
        <SecondaryButton href="/contact" style={{ width: '100%', textAlign: 'center' }}>{tier.cta}</SecondaryButton>
      ) : annualNA ? (
        <span style={{ display: 'block', textAlign: 'center', fontSize: 13, color: muteColor }}>Annual billing coming soon</span>
      ) : (
        <PrimaryButton
          href={href(isPersonal ? 'personal' : 'builder', interval)}
          style={{ width: '100%', textAlign: 'center', ...(isFeatured ? { background: C.accent, borderColor: C.accent } : {}) }}
        >
          {getPlanCta(isPersonal ? 'personal' : 'builder', interval)}
        </PrimaryButton>
      )}

      {!isPersonal && !isEnt && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: muteColor, textAlign: 'center' }}>
          No credit card required · Cancel anytime
        </p>
      )}
    </article>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type Props = { annualBillingEnabled: boolean }

export default function PlansPageClient({ annualBillingEnabled }: Props) {
  const [interval,    setInterval]    = useState<BillingInterval>('month')
  const [currentPlan, setCurrentPlan] = useState<string | null>(null)
  const [tableOpen,   setTableOpen]   = useState(false)

  useEffect(() => {
    fetch('/api/identity/plan', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then((d: { plan?: string } | null) => setCurrentPlan(d?.plan ?? null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (interval === 'year' && !annualBillingEnabled) setInterval('month')
  }, [interval, annualBillingEnabled])


  return (
    <div style={{ background: C.bg, minHeight: '100dvh', color: C.text, fontFamily: 'var(--sans, Inter, -apple-system, sans-serif)', overflowX: 'hidden' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(32px,5vh,56px) clamp(20px,4vw,32px) 96px' }}>

        <Link href="/dashboard" style={{ display: 'inline-block', fontSize: 14, color: C.textMute, textDecoration: 'none', marginBottom: 40 }}>← Back to Home</Link>

        {currentPlan && currentPlan !== 'free' && (
          <div style={{ background: C.accentSoft, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 16px', marginBottom: 32, fontSize: 14, color: C.textSub }}>
            Current plan: <strong style={{ color: C.text }}>{currentPlan}</strong>.{' '}
            <Link href="/settings/billing" style={{ color: C.accent }}>Manage billing →</Link>
          </div>
        )}

        {/* ── Hero ── */}
        <header style={{ maxWidth: 680, marginBottom: 48 }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textMute }}>Pricing</p>
          <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(30px,4vw,44px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, color: C.text }}>
            The operating system<br />for builders.
          </h1>
          <p style={{ margin: '0 0 28px', fontSize: 18, lineHeight: 1.6, color: C.textSub, maxWidth: '46ch' }}>
            Registry. Projects. CRM. Assets. Vaults. Workflows. Intelligence.<br />
            Everything your operation needs. One platform.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <PrimaryButton href={href('builder', 'month')}>Start free 14-day trial</PrimaryButton>
            <SecondaryButton href="#compare">Compare plans ↓</SecondaryButton>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 13, color: C.textMute }}>No credit card required · Cancel anytime</p>
        </header>

        {/* ── Billing interval toggle ── */}
        <div style={{ marginBottom: 44, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: C.bgAlt, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {(['month', 'year'] as const).map(iv => (
              <button key={iv} type="button" disabled={iv === 'year' && !annualBillingEnabled}
                onClick={() => (annualBillingEnabled || iv === 'month') ? setInterval(iv) : undefined}
                style={{ padding: '7px 18px', fontSize: 13, fontWeight: 600, background: interval === iv ? C.text : 'transparent', color: interval === iv ? '#fff' : C.textMute, border: 'none', cursor: iv === 'year' && !annualBillingEnabled ? 'not-allowed' : 'pointer', opacity: iv === 'year' && !annualBillingEnabled ? 0.45 : 1, transition: 'all 0.15s' }}>
                {iv === 'month' ? 'Monthly' : 'Annual'}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 13, color: interval === 'year' ? C.green : C.textMute, fontWeight: interval === 'year' ? 600 : 400 }}>
            {interval === 'year' ? '2 months free — save up to $198/year' : 'Switch to annual and save 2 months'}
          </span>
        </div>

        {/* ── Plan cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 80 }}>
          {PLAN_TIERS.map(tier => (
            <PlanCard key={tier.id} tier={tier} interval={interval} annualEnabled={annualBillingEnabled} />
          ))}
        </div>

        {/* ── Comparison table ── */}
        <section id="compare" style={{ marginBottom: 80 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textMute }}>Full Comparison</p>
              <h2 style={{ margin: 0, fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, letterSpacing: '-0.025em', color: C.text }}>Everything, side by side.</h2>
            </div>
            <button type="button" onClick={() => setTableOpen(v => !v)}
              style={{ fontSize: 14, color: C.accent, background: C.accentSoft, border: `1px solid rgba(14,165,185,0.25)`, borderRadius: 6, padding: '7px 16px', cursor: 'pointer' }}>
              {tableOpen ? 'Collapse' : 'Expand full table'}
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ background: C.bgDark }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', borderBottom: '1px solid rgba(255,255,255,0.08)', width: '36%' }}>Feature</th>
                  {['Personal', 'Builder', 'Enterprise'].map(p => (
                    <th key={p} style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: p === 'Builder' ? C.accent : 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_SECTIONS.slice(0, tableOpen ? undefined : 2).map(section => (
                  <>
                    <tr key={section.label}>
                      <td colSpan={4} style={{ padding: '12px 16px 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textMute, background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
                        {section.label}
                      </td>
                    </tr>
                    {section.rows.map(row => (
                      <tr key={row.feature} style={{ background: C.bg }}>
                        <td style={{ padding: '11px 16px', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, fontWeight: 500 }}>{row.feature}</td>
                        <Cell value={row.personal} />
                        <Cell value={row.builder} />
                        <Cell value={row.enterprise} />
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          {!tableOpen && (
            <button type="button" onClick={() => setTableOpen(true)}
              style={{ marginTop: 12, fontSize: 14, color: C.accent, background: C.accentSoft, border: `1px solid rgba(14,165,185,0.2)`, borderRadius: 6, padding: '8px 20px', cursor: 'pointer', display: 'block', width: '100%' }}>
              Show all {COMPARE_SECTIONS.reduce((a, s) => a + s.rows.length, 0)} features ↓
            </button>
          )}
        </section>

        {/* ── Competitor comparison ── */}
        <section style={{ marginBottom: 80 }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textMute }}>Competitive Positioning</p>
          <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, letterSpacing: '-0.025em', color: C.text }}>One platform. Five tools replaced.</h2>
          <p style={{ margin: '0 0 32px', fontSize: 16, color: C.textSub, lineHeight: 1.6, maxWidth: '52ch' }}>
            The average builder pays for Notion + ClickUp + Airtable + ChatGPT + HubSpot.
            That&apos;s $75–$200/month. ACCESS is $99/month and replaces all five.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 32 }}>
            {COMPETITORS.map(c => (
              <div key={c.name} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: 15, fontWeight: 700, color: C.text }}>{c.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: C.textMute }}>{c.cat}</p>
                  </div>
                  <span style={{ fontSize: 12, color: C.textMute, background: C.bgAlt, padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap', marginLeft: 8 }}>{c.price}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: C.textSub, lineHeight: 1.55 }}>{c.gap}</p>
              </div>
            ))}
          </div>
          <div style={{ background: C.bgDark, borderRadius: 12, padding: '28px 32px', display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ maxWidth: 480 }}>
              <p style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.95)', lineHeight: 1.35 }}>
                &ldquo;What are you paying for Notion + ClickUp + Airtable + ChatGPT?&rdquo;
              </p>
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>If it&apos;s more than $99/month — Builder replaces all of it.</p>
            </div>
            <PrimaryButton href={href('builder', 'month')} style={{ background: C.accent, borderColor: C.accent, flexShrink: 0 }}>Start free trial →</PrimaryButton>
          </div>
        </section>

        {/* ── Built for section ── */}
        <section style={{ marginBottom: 80 }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textMute }}>Built For</p>
          <h2 style={{ margin: '0 0 28px', fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, letterSpacing: '-0.025em', color: C.text }}>Every kind of builder.</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {['Founders', 'Creators', 'Consultants', 'Agencies', 'Nonprofits', 'Churches', 'Operators', 'Teams', 'Solopreneurs', 'Coaches', 'Freelancers', 'Organizations'].map(who => (
              <span key={who} style={{ fontSize: 14, fontWeight: 600, color: C.text, background: C.bgAlt, border: `1px solid ${C.border}`, padding: '8px 16px', borderRadius: 100 }}>{who}</span>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ marginBottom: 80 }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textMute }}>FAQ</p>
          <h2 style={{ margin: '0 0 32px', fontSize: 'clamp(22px,3vw,30px)', fontWeight: 700, letterSpacing: '-0.025em', color: C.text }}>Common questions.</h2>
          <div style={{ maxWidth: 700 }}>
            {FAQS.map(faq => <FaqItem key={faq.q} {...faq} />)}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section style={{ background: C.bgDark, borderRadius: 20, padding: 'clamp(40px,5vw,60px)', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 700, letterSpacing: '-0.025em', color: '#fff', lineHeight: 1.2 }}>
            Ready to run your operation<br />in one place?
          </h2>
          <p style={{ margin: '0 0 32px', fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Start free for 14 days on Builder. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryButton href={href('builder', 'month')} style={{ background: C.accent, borderColor: C.accent, fontSize: 16 }}>Start free 14-day trial</PrimaryButton>
            <SecondaryButton href="/contact" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>Talk to us about Enterprise →</SecondaryButton>
          </div>
          <p style={{ margin: '16px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            Personal · Builder · Enterprise · Multiple payment methods accepted
          </p>
        </section>

        {/* ── Footer ── */}
        <footer style={{ marginTop: 48, display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/settings/billing" style={{ fontSize: 13, color: C.textMute, textDecoration: 'none' }}>Manage billing</Link>
          <Link href="/compare" style={{ fontSize: 13, color: C.textMute, textDecoration: 'none' }}>Full comparison</Link>
          <Link href="/terms" style={{ fontSize: 13, color: C.textMute, textDecoration: 'none' }}>Terms</Link>
          <Link href="/privacy" style={{ fontSize: 13, color: C.textMute, textDecoration: 'none' }}>Privacy</Link>
          <Link href="/contact" style={{ fontSize: 13, color: C.textMute, textDecoration: 'none' }}>Contact</Link>
        </footer>

      </div>
    </div>
  )
}
