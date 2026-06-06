'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PrimaryButton, SecondaryButton } from '@/lib/design-system/components/platform'

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
  red:        '#E53E3E',
  redSoft:    'rgba(229,62,62,0.08)',
} as const

// ─── ACCESS vs competitors matrix ─────────────────────────────────────────────

const CAPABILITIES = [
  {
    category: 'Intelligence',
    items: [
      { label: 'AI that knows your projects', access: true, notion: false, clickup: false, hubspot: false, chatgpt: false },
      { label: 'AI with persistent memory', access: true, notion: false, clickup: false, hubspot: false, chatgpt: 'Limited' },
      { label: 'Cross-module intelligence', access: true, notion: false, clickup: false, hubspot: false, chatgpt: false },
      { label: 'Monthly AI business summaries', access: true, notion: false, clickup: false, hubspot: 'Paid', chatgpt: false },
      { label: 'AI-created objects via terminal', access: true, notion: false, clickup: false, hubspot: false, chatgpt: false },
    ],
  },
  {
    category: 'Registry & Ownership',
    items: [
      { label: 'Asset registry (owned objects)', access: true, notion: false, clickup: false, hubspot: false, chatgpt: false },
      { label: 'Blueprint / system templates', access: true, notion: 'Limited', clickup: 'Limited', hubspot: false, chatgpt: false },
      { label: 'Vault infrastructure', access: true, notion: false, clickup: false, hubspot: false, chatgpt: false },
      { label: 'Identity layer (ACCESS ID)', access: true, notion: false, clickup: false, hubspot: false, chatgpt: false },
    ],
  },
  {
    category: 'Projects & Work',
    items: [
      { label: 'Project management', access: true, notion: 'Limited', clickup: true, hubspot: 'Limited', chatgpt: false },
      { label: 'Kanban / task views', access: 'Roadmap', notion: true, clickup: true, hubspot: true, chatgpt: false },
      { label: 'Workflow automation', access: true, notion: false, clickup: true, hubspot: true, chatgpt: false },
      { label: 'Knowledge base', access: true, notion: true, clickup: 'Limited', hubspot: 'Limited', chatgpt: false },
    ],
  },
  {
    category: 'CRM & Customers',
    items: [
      { label: 'Contact management (CRM)', access: true, notion: 'Limited', clickup: 'Limited', hubspot: true, chatgpt: false },
      { label: 'Pipeline / deals', access: 'Roadmap', notion: false, clickup: 'Limited', hubspot: true, chatgpt: false },
      { label: 'Email integration', access: 'Roadmap', notion: false, clickup: false, hubspot: true, chatgpt: false },
      { label: 'Offers / service catalog', access: true, notion: false, clickup: false, hubspot: true, chatgpt: false },
    ],
  },
  {
    category: 'Team & Enterprise',
    items: [
      { label: 'RBAC / role permissions', access: true, notion: true, clickup: true, hubspot: true, chatgpt: false },
      { label: 'Audit logs', access: true, notion: false, clickup: 'Paid', hubspot: 'Enterprise', chatgpt: false },
      { label: 'REST API', access: true, notion: true, clickup: true, hubspot: true, chatgpt: true },
      { label: 'Custom integrations', access: true, notion: 'Limited', clickup: true, hubspot: true, chatgpt: 'Limited' },
      { label: 'SSO / SAML', access: 'Roadmap', notion: 'Enterprise', clickup: 'Enterprise', hubspot: 'Enterprise', chatgpt: 'Enterprise' },
    ],
  },
  {
    category: 'Pricing Structure',
    items: [
      { label: 'Flat pricing (not per-seat)', access: true, notion: false, clickup: false, hubspot: false, chatgpt: false },
      { label: 'ACH bank transfer', access: true, notion: false, clickup: false, hubspot: 'Enterprise', chatgpt: false },
      { label: 'Free trial', access: true, notion: false, clickup: true, hubspot: true, chatgpt: false },
      { label: 'Annual billing discount', access: true, notion: true, clickup: true, hubspot: true, chatgpt: false },
    ],
  },
]

const TOOLS = [
  { key: 'access',  label: 'ACCESS',  color: C.accent },
  { key: 'notion',  label: 'Notion',  color: C.textMute },
  { key: 'clickup', label: 'ClickUp', color: C.textMute },
  { key: 'hubspot', label: 'HubSpot', color: C.textMute },
  { key: 'chatgpt', label: 'ChatGPT', color: C.textMute },
] as const

type ToolKey = typeof TOOLS[number]['key']

// ─── Cost comparison ──────────────────────────────────────────────────────────

const STACK_COMPARISON = [
  { tool: 'Notion (3 users)',         monthly: 48,  purpose: 'Notes + projects' },
  { tool: 'ClickUp (3 users)',        monthly: 36,  purpose: 'Task management' },
  { tool: 'Airtable (free → paid)',   monthly: 20,  purpose: 'Database / CRM' },
  { tool: 'ChatGPT Plus',             monthly: 20,  purpose: 'AI assistant' },
  { tool: 'HubSpot Starter',         monthly: 15,  purpose: 'CRM basics' },
]

const STACK_TOTAL = STACK_COMPARISON.reduce((s, t) => s + t.monthly, 0)

// ─── Table cell ───────────────────────────────────────────────────────────────

type CellValue = boolean | string

function TableCell({ value, isAccess }: { value: CellValue; isAccess?: boolean }) {
  const base: React.CSSProperties = {
    padding: '11px 14px', fontSize: 13, borderBottom: `1px solid ${C.border}`,
    textAlign: 'center', verticalAlign: 'middle',
  }

  if (value === true) {
    return (
      <td style={base}>
        <span style={{ color: isAccess ? C.accent : C.green, fontWeight: 700, fontSize: 15 }}>✓</span>
      </td>
    )
  }
  if (value === false) {
    return <td style={{ ...base, color: C.border, fontSize: 16 }}>—</td>
  }
  return (
    <td style={{ ...base, color: isAccess ? C.accent : C.textMute, fontSize: 12, fontWeight: 500 }}>
      {value}
    </td>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ComparePageClient() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  return (
    <div style={{ background: C.bg, minHeight: '100dvh', color: C.text, fontFamily: 'var(--sans, Inter, -apple-system, sans-serif)' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: 'clamp(32px,5vh,56px) clamp(20px,4vw,32px) 96px' }}>

        <Link href="/plans" style={{ display: 'inline-block', fontSize: 14, color: C.textMute, textDecoration: 'none', marginBottom: 40 }}>← Back to Plans</Link>

        {/* Hero */}
        <header style={{ maxWidth: 640, marginBottom: 56 }}>
          <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textMute }}>Comparison</p>
          <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, color: C.text }}>
            ACCESS vs the tools you&apos;re already paying for.
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: 18, lineHeight: 1.6, color: C.textSub }}>
            Most builders pay $100–$200/month across 5 tools. ACCESS replaces all of them at $99/month — and adds the AI intelligence layer none of them have.
          </p>
          <PrimaryButton href="/checkout/builder?interval=month">Start free 14-day trial →</PrimaryButton>
        </header>

        {/* Stack cost comparison */}
        <section style={{ marginBottom: 72, background: C.bgAlt, borderRadius: 16, padding: 'clamp(28px,4vw,44px)', border: `1px solid ${C.border}` }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 700, letterSpacing: '-0.025em', color: C.text }}>
            The average builder&apos;s tool stack: ${STACK_TOTAL}/month
          </h2>
          <p style={{ margin: '0 0 28px', fontSize: 15, color: C.textSub }}>
            That&apos;s ${(STACK_TOTAL * 12).toLocaleString('en-US')}/year — and none of them talk to each other.
          </p>

          <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
            {STACK_COMPARISON.map(t => (
              <div key={t.tool} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.bg, borderRadius: 8, padding: '14px 16px', border: `1px solid ${C.border}` }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t.tool}</span>
                  <span style={{ fontSize: 12, color: C.textMute, marginLeft: 8 }}>{t.purpose}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>${t.monthly}/mo</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 10, padding: '20px 20px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#856404' }}>Current Stack</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#856404' }}>${STACK_TOTAL}/month</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#856404' }}>5 tools, 0 shared context</p>
            </div>
            <div style={{ background: C.greenSoft, border: `1px solid rgba(45,138,110,0.3)`, borderRadius: 10, padding: '20px 20px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.green }}>ACCESS Builder</p>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.green }}>$99/month</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: C.green }}>1 platform, full context</p>
            </div>
          </div>
          <p style={{ margin: '16px 0 0', fontSize: 14, color: C.textSub, fontWeight: 500 }}>
            You save ${STACK_TOTAL - 99}/month — ${((STACK_TOTAL - 99) * 12).toLocaleString('en-US')}/year — switching to ACCESS Builder.
          </p>
        </section>

        {/* Feature matrix */}
        <section style={{ marginBottom: 72 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.textMute }}>Feature Matrix</p>
              <h2 style={{ margin: 0, fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 700, letterSpacing: '-0.025em', color: C.text }}>ACCESS vs Notion vs ClickUp vs HubSpot vs ChatGPT</h2>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CAPABILITIES.map(s => (
                <button key={s.category} type="button"
                  onClick={() => setActiveSection(activeSection === s.category ? null : s.category)}
                  style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, border: `1px solid ${activeSection === s.category ? C.accent : C.border}`, background: activeSection === s.category ? C.accentSoft : 'transparent', color: activeSection === s.category ? C.accent : C.textMute, cursor: 'pointer', fontWeight: 600 }}>
                  {s.category}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: C.bgDark }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', borderBottom: '1px solid rgba(255,255,255,0.08)', width: '30%' }}>Capability</th>
                  {TOOLS.map(t => (
                    <th key={t.key} style={{ padding: '14px 12px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: t.key === 'access' ? C.accent : 'rgba(255,255,255,0.75)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{t.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPABILITIES
                  .filter(s => !activeSection || s.category === activeSection)
                  .map(section => (
                    <>
                      <tr key={section.category}>
                        <td colSpan={6} style={{ padding: '12px 16px 6px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textMute, background: C.bgAlt, borderBottom: `1px solid ${C.border}` }}>
                          {section.category}
                        </td>
                      </tr>
                      {section.items.map(row => (
                        <tr key={row.label} style={{ background: C.bg }}>
                          <td style={{ padding: '11px 16px', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, fontWeight: 500 }}>{row.label}</td>
                          <TableCell value={row.access as CellValue} isAccess />
                          <TableCell value={row.notion as CellValue} />
                          <TableCell value={row.clickup as CellValue} />
                          <TableCell value={row.hubspot as CellValue} />
                          <TableCell value={row.chatgpt as CellValue} />
                        </tr>
                      ))}
                    </>
                  ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: C.textMute }}>&ldquo;Roadmap&rdquo; = planned, not yet shipped. All competitor data is approximate as of 2026.</p>
        </section>

        {/* Why the flat price wins */}
        <section style={{ marginBottom: 72 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 700, letterSpacing: '-0.025em', color: C.text }}>The per-seat penalty</h2>
          <p style={{ margin: '0 0 32px', fontSize: 15, color: C.textSub, lineHeight: 1.6, maxWidth: '54ch' }}>
            Every competitor charges per seat. ACCESS doesn&apos;t (until Enterprise). Here&apos;s what per-seat pricing actually costs a 3-person team:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { tool: 'Notion (3 seats)',     monthly: 48  },
              { tool: 'ClickUp (3 seats)',    monthly: 36  },
              { tool: 'Asana (3 seats)',      monthly: 75  },
              { tool: 'Monday (3 seats)',     monthly: 48  },
              { tool: 'ACCESS Builder',       monthly: 99, highlight: true },
            ].map(t => (
              <div key={t.tool} style={{ background: t.highlight ? C.bgDark : C.bg, border: `1px solid ${t.highlight ? 'rgba(14,165,185,0.3)' : C.border}`, borderRadius: 10, padding: '20px 18px' }}>
                <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: t.highlight ? '#fff' : C.text }}>{t.tool}</p>
                <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: t.highlight ? C.accent : C.text }}>${t.monthly}<span style={{ fontSize: 13, fontWeight: 500, color: t.highlight ? 'rgba(255,255,255,0.5)' : C.textMute }}>/mo</span></p>
                {t.highlight && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>All features · 1 flat price</p>}
              </div>
            ))}
          </div>
        </section>

        {/* The intelligence gap */}
        <section style={{ marginBottom: 72, background: C.bgDark, borderRadius: 16, padding: 'clamp(28px,4vw,48px)' }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>The Intelligence Gap</p>
          <h2 style={{ margin: '0 0 16px', fontSize: 'clamp(20px,2.5vw,28px)', fontWeight: 700, letterSpacing: '-0.025em', color: '#fff', lineHeight: 1.25 }}>
            Every other tool adds AI on top.<br />ACCESS builds AI in.
          </h2>
          <p style={{ margin: '0 0 32px', fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: '54ch' }}>
            Notion AI, ClickUp AI, HubSpot AI — these are all the same thing: a generic LLM added as a feature.
            They don&apos;t know your projects. They don&apos;t know your customers. They don&apos;t know your assets.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { label: 'ChatGPT asks:',   text: '"What would you like help with today?"' },
              { label: 'Notion AI asks:',  text: '"What would you like to write?"' },
              { label: 'JYSON says:',      text: '"Your Bridge Video project has 3 open tasks and is 6 days from its deadline. Your vault has 23 assets. You have 8 new CRM contacts this month."', highlight: true },
            ].map(c => (
              <div key={c.label} style={{ background: c.highlight ? 'rgba(14,165,185,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${c.highlight ? 'rgba(14,165,185,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '20px 20px' }}>
                <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: c.highlight ? C.accent : 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</p>
                <p style={{ margin: 0, fontSize: 14, color: c.highlight ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', lineHeight: 1.55, fontStyle: 'italic' }}>{c.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, letterSpacing: '-0.025em', color: C.text }}>
            One platform. Everything your operation needs.
          </h2>
          <p style={{ margin: '0 0 28px', fontSize: 16, color: C.textSub }}>Start free for 14 days on Builder. No credit card required.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryButton href="/checkout/builder?interval=month">Start free 14-day trial</PrimaryButton>
            <SecondaryButton href="/plans">See pricing →</SecondaryButton>
          </div>
        </section>

      </div>
    </div>
  )
}
