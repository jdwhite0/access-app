'use client'

import Link from 'next/link'
import AccessMarketingLayout from '@/components/marketing/AccessMarketingLayout'
import PublicHeader from '@/components/marketing/PublicHeader'
import InfrastructureVisual from '@/components/marketing/InfrastructureVisual'
import { useMarketingAuthActions } from '@/components/marketing/useMarketingAuthActions'

// ─── Design tokens (white-first, Stripe-anchored) ─────────────────────────────

const C = {
  bg:       '#FFFFFF',
  bgAlt:    '#F7F9FC',
  bgDark:   '#0A2540',
  text:     '#0A2540',
  textSub:  '#425466',
  textMute: '#697386',
  border:   '#E6EBF1',
  accent:   '#40C0D0',
  accentDk: '#1A8FA0',
  success:  '#2D8A6E',
} as const

const MAX = 1200

// ─── Sections ─────────────────────────────────────────────────────────────────

const PROOF_ITEMS = [
  'Founders',
  'Operators',
  'Creators',
  'Teams',
  'Organizations',
  'Builders',
]

const STATS = [
  { value: '99.9%', label: 'Platform uptime SLA', sub: 'Builder & Operator plans' },
  { value: '$0', label: 'To start', sub: 'Free tier, no card required' },
  { value: '6', label: 'Core OS modules', sub: 'Registry, Projects, Agents, Memory, Vaults, Workflows' },
  { value: '∞', label: 'Compounds over time', sub: 'Every session builds on the last' },
]

const FEATURES = [
  {
    eyebrow: 'Registry',
    headline: 'Every system,\nasset, and project\nin one structured layer.',
    body: 'The ACCESS Registry replaces scattered notes, folders, and tools with a living database of everything you\'ve built. Query it. Reference it. Build on top of it.',
    points: [
      'Systems, blueprints, assets, and workflows — all connected',
      'Sub-modules for every object type in your operation',
      'Search, filter, and navigate without losing context',
    ],
    visual: <RegistryVisual />,
    imageRight: false,
  },
  {
    eyebrow: 'JYSON',
    headline: 'An AI that knows\nyour context and\ncompounds with you.',
    body: 'JYSON is not a chatbot. It reads your registry, remembers your sessions, and recommends what to work on next based on everything you\'ve built.',
    points: [
      'Full context on your projects, systems, and goals',
      'Session memory that persists across conversations',
      'Proactive recommendations — not just reactive responses',
    ],
    visual: <JysonVisual />,
    imageRight: true,
  },
  {
    eyebrow: 'Workflows',
    headline: 'Automation that runs\nwhen you\'re not watching.',
    body: 'Build sequences that execute across your tools and registry. Workflows connect your systems and generate output without your manual intervention.',
    points: [
      'Trigger-based automation across ACCESS modules',
      'Connect external tools and APIs',
      'Monitor execution history and output in one place',
    ],
    visual: <WorkflowVisual />,
    imageRight: false,
  },
]

// ─── Sub-visuals ──────────────────────────────────────────────────────────────

function RegistryVisual() {
  const rows = [
    { type: 'System', name: 'Bridge Video', status: 'active', tag: 'Production' },
    { type: 'Project', name: 'ACCESS V3', status: 'active', tag: 'In Progress' },
    { type: 'Asset', name: 'JD Brand Kit', status: 'stored', tag: 'Design' },
    { type: 'Workflow', name: 'Daily Brief', status: 'running', tag: 'Automation' },
    { type: 'Blueprint', name: 'Seed Protocol', status: 'active', tag: 'Infrastructure' },
    { type: 'Vault', name: 'Command Vault', status: 'synced', tag: 'Knowledge' },
  ]
  const statusColor: Record<string, string> = {
    active: '#4ABDA0', running: '#40C0D0', stored: '#7C6CF8', synced: '#C9A46A',
  }
  return (
    <div style={{ background: '#0B0E14', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(10,37,64,0.2)' }}>
      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 90px', padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0D1017' }}>
        {['Type', 'Name', 'Status', 'Tag'].map((h) => (
          <span key={h} style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>{h}</span>
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{
          display: 'grid',
          gridTemplateColumns: '80px 1fr 80px 90px',
          padding: '9px 16px',
          borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          alignItems: 'center',
          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
        }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>{row.type}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--mono)', fontWeight: 500 }}>{row.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor[row.status] ?? '#888' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--mono)' }}>{row.status}</span>
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 3 }}>{row.tag}</span>
        </div>
      ))}
    </div>
  )
}

function JysonVisual() {
  const messages = [
    { role: 'user', text: 'What should I work on next?', ts: '9:42 AM' },
    { role: 'jyson', text: 'Based on your registry, Bridge Video has 3 open tasks and is closest to a revenue milestone. I\'d prioritize the intro video script today.', ts: '9:42 AM' },
    { role: 'user', text: 'What\'s the status of the ACCESS deploy?', ts: '9:44 AM' },
    { role: 'jyson', text: 'ACCESS V3 deployed successfully at 1:26 AM. 31 routes live. Stripe webhooks registered. The admin panel is at /admin.', ts: '9:44 AM' },
  ]
  return (
    <div style={{ background: '#0B0E14', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(10,37,64,0.2)', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#40C0D0', display: 'inline-block' }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--mono)', letterSpacing: '0.08em' }}>JYSON · Session active</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 3 }}>
            <div style={{
              maxWidth: '85%',
              padding: '8px 12px',
              borderRadius: m.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
              background: m.role === 'user' ? 'rgba(64,192,208,0.12)' : 'rgba(255,255,255,0.05)',
              border: m.role === 'user' ? '1px solid rgba(64,192,208,0.2)' : '1px solid rgba(255,255,255,0.06)',
              fontSize: 11,
              color: m.role === 'user' ? '#40C0D0' : 'rgba(240,240,240,0.75)',
              lineHeight: 1.55,
              fontFamily: 'var(--mono)',
            }}>
              {m.text}
            </div>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--mono)' }}>{m.ts}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkflowVisual() {
  const steps = [
    { id: '01', label: 'Trigger', desc: 'Daily at 7:00 AM', color: '#40C0D0', status: 'done' },
    { id: '02', label: 'JYSON Brief', desc: 'Generate daily summary', color: '#7C6CF8', status: 'done' },
    { id: '03', label: 'Registry Scan', desc: 'Check active projects', color: '#4ABDA0', status: 'done' },
    { id: '04', label: 'Notify', desc: 'Push to dashboard', color: '#C9A46A', status: 'running' },
  ]
  return (
    <div style={{ background: '#0B0E14', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(10,37,64,0.2)', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Daily Brief Workflow</span>
        <span style={{ fontSize: 9, color: '#40C0D0', fontFamily: 'var(--mono)', background: 'rgba(64,192,208,0.1)', border: '1px solid rgba(64,192,208,0.2)', borderRadius: 100, padding: '1px 7px' }}>Running</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {steps.map((step, i) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step.status === 'done' ? step.color : 'rgba(255,255,255,0.06)',
                border: `1px solid ${step.status === 'done' ? step.color : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: step.status === 'done' ? '#000' : 'rgba(255,255,255,0.3)',
                fontWeight: 700, fontFamily: 'var(--mono)', flexShrink: 0,
              }}>
                {step.status === 'done' ? '✓' : '…'}
              </div>
              {i < steps.length - 1 && <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)' }} />}
            </div>
            <div style={{ paddingTop: 4, paddingBottom: i < steps.length - 1 ? 8 : 0 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0, fontWeight: 500, fontFamily: 'var(--mono)' }}>{step.label}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', fontFamily: 'var(--mono)' }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PublicHomePage() {
  const { startBuilding } = useMarketingAuthActions()

  return (
    <AccessMarketingLayout>
      <PublicHeader />

      {/* ── Hero ── left-right asymmetric, white ground */}
      <section style={{
        background: C.bg,
        paddingTop: 96,
        paddingBottom: 80,
        overflow: 'hidden',
      }}>
        <div style={{
          maxWidth: MAX,
          margin: '0 auto',
          padding: '0 clamp(20px, 3vw, 48px)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(40px, 5vw, 80px)',
          alignItems: 'center',
          minHeight: 540,
        }}>
          {/* Left: copy */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: `rgba(64,192,208,0.08)`,
              border: `1px solid rgba(64,192,208,0.2)`,
              borderRadius: 100,
              padding: '4px 12px',
              marginBottom: 28,
              fontSize: 12,
              fontFamily: 'var(--mono)',
              letterSpacing: '0.08em',
              color: C.accentDk,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, display: 'inline-block' }} />
              Now in early access
            </div>

            <h1 style={{
              fontSize: 'clamp(40px, 4.5vw, 58px)',
              fontWeight: 700,
              lineHeight: 1.06,
              letterSpacing: '-0.04em',
              color: C.text,
              margin: '0 0 24px',
            }}>
              Infrastructure for
              <br />
              <span style={{ color: C.accent }}>builders who compound.</span>
            </h1>

            <p style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: C.textSub,
              margin: '0 0 36px',
              maxWidth: '42ch',
            }}>
              ACCESS is the operating system for founders and operators — registry, AI memory,
              projects, and workflows in one platform that gets smarter as you build.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={startBuilding}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: C.text,
                  border: 'none',
                  borderRadius: 6,
                  padding: '12px 22px',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1a3550' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.text }}
              >
                Start for free <span style={{ fontSize: 16 }}>→</span>
              </button>
              <Link href="/plans" style={{
                fontSize: 15,
                fontWeight: 500,
                color: C.textSub,
                textDecoration: 'none',
                padding: '12px 18px',
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                transition: 'border-color 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}>
                View pricing
              </Link>
            </div>

            <p style={{
              marginTop: 16,
              fontSize: 13,
              color: C.textMute,
              fontFamily: 'var(--mono)',
            }}>
              Free tier available · No credit card required
            </p>
          </div>

          {/* Right: product visual */}
          <div style={{ position: 'relative' }}>
            <InfrastructureVisual />
          </div>
        </div>
      </section>

      {/* ── Trust row — "Built for" ── */}
      <section style={{
        background: C.bgAlt,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        padding: '28px clamp(20px, 3vw, 48px)',
      }}>
        <div style={{
          maxWidth: MAX,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(16px, 3vw, 40px)',
          flexWrap: 'wrap',
        }}>
          <p style={{
            fontSize: 12,
            fontFamily: 'var(--mono)',
            letterSpacing: '0.12em',
            color: C.textMute,
            textTransform: 'uppercase',
            flexShrink: 0,
            margin: 0,
          }}>
            Built for
          </p>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            flex: 1,
            flexWrap: 'wrap',
          }}>
            {PROOF_ITEMS.map((item, i) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text,
                  padding: '0 clamp(12px, 2vw, 24px)',
                }}>
                  {item}
                </span>
                {i < PROOF_ITEMS.length - 1 && (
                  <span style={{ color: C.border, fontSize: 18 }}>·</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{
        background: C.bg,
        padding: 'clamp(64px, 8vw, 96px) clamp(20px, 3vw, 48px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          maxWidth: MAX,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '32px 48px',
        }}>
          {STATS.map((s) => (
            <div key={s.value}>
              <p style={{
                fontSize: 'clamp(40px, 4vw, 52px)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                color: C.text,
                margin: '0 0 6px',
                lineHeight: 1,
                fontFamily: 'var(--mono)',
              }}>{s.value}</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>{s.label}</p>
              <p style={{ fontSize: 13, color: C.textMute, margin: 0, lineHeight: 1.5 }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature sections (alternating left/right) ── */}
      {FEATURES.map((feat, i) => (
        <section
          key={feat.eyebrow}
          id={i === 0 ? 'product' : i === 1 ? 'solutions' : 'developers'}
          style={{
            background: i % 2 === 0 ? C.bg : C.bgAlt,
            borderBottom: `1px solid ${C.border}`,
            padding: 'clamp(72px, 9vw, 108px) clamp(20px, 3vw, 48px)',
          }}
        >
          <div style={{
            maxWidth: MAX,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(40px, 5vw, 80px)',
            alignItems: 'center',
            direction: feat.imageRight ? 'ltr' : 'ltr',
          }}>
            {/* Text block */}
            <div style={{ order: feat.imageRight ? 1 : 0 }}>
              <p style={{
                fontSize: 12,
                fontFamily: 'var(--mono)',
                letterSpacing: '0.12em',
                color: C.accent,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}>{feat.eyebrow}</p>
              <h2 style={{
                fontSize: 'clamp(28px, 3.2vw, 40px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: C.text,
                margin: '0 0 18px',
                whiteSpace: 'pre-line',
              }}>{feat.headline}</h2>
              <p style={{
                fontSize: 16,
                lineHeight: 1.65,
                color: C.textSub,
                margin: '0 0 24px',
                maxWidth: '44ch',
              }}>{feat.body}</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feat.points.map((pt) => (
                  <li key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: C.textSub, lineHeight: 1.5 }}>
                    <span style={{ color: C.success, fontSize: 13, marginTop: 1, flexShrink: 0, fontWeight: 600 }}>✓</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
            {/* Visual block */}
            <div style={{ order: feat.imageRight ? 0 : 1 }}>
              {feat.visual}
            </div>
          </div>
        </section>
      ))}

      {/* ── Enterprise CTA ── */}
      <section style={{
        background: C.bgDark,
        padding: 'clamp(72px, 9vw, 100px) clamp(20px, 3vw, 48px)',
      }}>
        <div style={{
          maxWidth: MAX,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 48,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ fontSize: 12, fontFamily: 'var(--mono)', letterSpacing: '0.12em', color: 'rgba(64,192,208,0.7)', textTransform: 'uppercase', marginBottom: 14 }}>Enterprise</p>
            <h2 style={{
              fontSize: 'clamp(28px, 3.5vw, 42px)',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: '#FFFFFF',
              margin: '0 0 14px',
            }}>
              Built for organizations
              <br />building at scale.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0, maxWidth: '48ch' }}>
              Custom deployments, team infrastructure, dedicated onboarding, and SLA agreements.
              Contact us to discuss what ACCESS looks like for your organization.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', flexShrink: 0 }}>
            <button
              onClick={startBuilding}
              style={{
                fontSize: 15, fontWeight: 600, color: C.text, background: '#FFFFFF',
                border: 'none', borderRadius: 6, padding: '13px 24px', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Start for free
            </button>
            <Link href="/contact" style={{
              fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none', padding: '13px 24px',
              border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, whiteSpace: 'nowrap',
              display: 'inline-block', textAlign: 'center',
            }}>
              Contact sales →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: C.bgAlt,
        borderTop: `1px solid ${C.border}`,
        padding: 'clamp(28px, 4vw, 40px) clamp(20px, 3vw, 48px)',
      }}>
        <div style={{
          maxWidth: MAX,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '0.12em' }}>ACCESS</span>
          <nav style={{ display: 'flex', gap: 24 }}>
            {[
              { label: 'Plans', href: '/plans' },
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Status', href: '/status' },
              { label: 'Contact', href: '/contact' },
            ].map((l) => (
              <Link key={l.label} href={l.href} style={{ fontSize: 13, color: C.textMute, textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </nav>
          <p style={{ fontSize: 12, color: C.textMute, fontFamily: 'var(--mono)', margin: 0 }}>
            © 2026 JD Productions Inc.
          </p>
        </div>
      </footer>
      <style>{`
        @media (max-width: 768px) {
          /* Hero: single column, visual below copy */
          section[aria-labelledby="hero-heading"] > div {
            grid-template-columns: 1fr !important;
            padding-top: 80px !important;
          }
          /* Feature sections: stack */
          section > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          /* Bento grid: single column */
          section > div[style*="repeat(3, 1fr)"] {
            grid-template-columns: 1fr !important;
          }
          section > div[style*="repeat(3, 1fr)"] > div {
            grid-column: span 1 !important;
          }
          /* Stats: 2 columns */
          section > div[style*="repeat(auto-fit, minmax(200px"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          /* Enterprise CTA: stack */
          section > div[style*="1fr auto"] {
            grid-template-columns: 1fr !important;
          }
          /* Plan cards: single column */
          section > div[style*="minmax(240px"] {
            grid-template-columns: 1fr !important;
          }
          /* InfrastructureVisual: hide floating panel on mobile */
          .infra-visual-float {
            display: none;
          }
          /* Marketing header actions on mobile */
          header[style*="height: 64px"] {
            height: 56px !important;
          }
        }
      `}</style>
    </AccessMarketingLayout>
  )
}
