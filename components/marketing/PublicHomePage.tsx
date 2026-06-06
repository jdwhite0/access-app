'use client'

import Link from 'next/link'
import AccessMarketingLayout from '@/components/marketing/AccessMarketingLayout'
import PublicHeader from '@/components/marketing/PublicHeader'
import { useMarketingAuthActions } from '@/components/marketing/useMarketingAuthActions'

const C = {
  bg:       '#FFFFFF',
  bgAlt:    '#F7F9FC',
  bgDark:   '#0A2540',
  bgDeep:   '#060D18',
  text:     '#0A2540',
  sub:      '#425466',
  mute:     '#697386',
  border:   '#E6EBF1',
  accent:   '#40C0D0',
  accentDk: '#1A8FA0',
  green:    '#2D8A6E',
  purple:   '#7C6CF8',
} as const

const MAX = 1200

// ─── UI sub-components ────────────────────────────────────────────────────────

function RegistryVisual() {
  const rows = [
    { type: 'System',   name: 'Bridge Video',    status: 'active',  tag: 'Production',     color: '#4ABDA0' },
    { type: 'Project',  name: 'ACCESS V3',        status: 'active',  tag: 'In Progress',    color: '#4ABDA0' },
    { type: 'Asset',    name: 'JD Brand Kit',     status: 'stored',  tag: 'Design',         color: C.purple },
    { type: 'Workflow', name: 'Daily Brief',      status: 'running', tag: 'Automation',     color: C.accent },
    { type: 'Blueprint',name: 'Seed Protocol',   status: 'active',  tag: 'Infrastructure', color: '#4ABDA0' },
    { type: 'Vault',    name: 'Command Vault',    status: 'synced',  tag: 'Knowledge',      color: '#C9A46A' },
  ]
  return (
    <div style={{ background: '#070C14', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', boxShadow: '0 32px 80px rgba(6,13,24,0.6), 0 0 0 1px rgba(64,192,208,0.06)' }}>
      {/* Title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0B1220' }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c) => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', marginLeft: 8, letterSpacing: '0.05em' }}>registry.access — 6 records</span>
      </div>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 80px 100px', padding: '7px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0D1422' }}>
        {['Type','Name','Status','Tag'].map((h) => (
          <span key={h} style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace' }}>{h}</span>
        ))}
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 80px 100px', padding: '9px 16px', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', alignItems: 'center', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{row.type}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', fontWeight: 500 }}>{row.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: row.color, boxShadow: `0 0 6px ${row.color}88` }} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{row.status}</span>
          </div>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', padding: '2px 7px', borderRadius: 4, display: 'inline-block' }}>{row.tag}</span>
        </div>
      ))}
    </div>
  )
}

function JysonVisual() {
  const messages = [
    { role: 'user',  text: 'What should I focus on today?',  ts: '9:42 AM' },
    { role: 'jyson', text: 'Bridge Video has 3 open tasks closest to a revenue milestone. I\'d prioritize the intro video script — that\'s the remaining blocker before the client review.', ts: '9:42 AM' },
    { role: 'user',  text: 'What\'s the status of the ACCESS deploy?', ts: '9:44 AM' },
    { role: 'jyson', text: 'ACCESS V3 deployed at 1:26 AM. 31 routes live, Stripe webhooks registered. The admin panel is live at /admin.', ts: '9:44 AM' },
  ]
  return (
    <div style={{ background: '#070C14', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', boxShadow: '0 32px 80px rgba(6,13,24,0.6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0B1220' }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c) => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', letterSpacing: '0.06em' }}>JYSON · Session active</span>
        </div>
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 3 }}>
            <div style={{ maxWidth: '88%', padding: '9px 13px', borderRadius: m.role === 'user' ? '10px 10px 3px 10px' : '10px 10px 10px 3px', background: m.role === 'user' ? 'rgba(64,192,208,0.1)' : 'rgba(255,255,255,0.05)', border: m.role === 'user' ? '1px solid rgba(64,192,208,0.18)' : '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: m.role === 'user' ? '#7DDCE8' : 'rgba(235,235,235,0.78)', lineHeight: 1.6, fontFamily: 'monospace' }}>
              {m.text}
            </div>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>{m.ts}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkflowVisual() {
  const steps = [
    { id: '01', label: 'Trigger',      desc: 'Daily at 7:00 AM',        color: C.accent,  done: true  },
    { id: '02', label: 'JYSON Brief',  desc: 'Generate daily summary',   color: C.purple,  done: true  },
    { id: '03', label: 'Registry Scan',desc: 'Check active projects',    color: '#4ABDA0', done: true  },
    { id: '04', label: 'Notify',       desc: 'Push to dashboard',        color: '#C9A46A', done: false },
  ]
  return (
    <div style={{ background: '#070C14', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', boxShadow: '0 32px 80px rgba(6,13,24,0.6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0B1220' }}>
        {['#FF5F57','#FEBC2E','#28C840'].map((c) => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', marginLeft: 8 }}>Daily Brief Workflow</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, color: C.accent, fontFamily: 'monospace', background: 'rgba(64,192,208,0.08)', border: '1px solid rgba(64,192,208,0.18)', borderRadius: 100, padding: '2px 9px' }}>Running</span>
      </div>
      <div style={{ padding: '20px' }}>
        {steps.map((step, i) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: i < steps.length - 1 ? 0 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: step.done ? step.color : 'rgba(255,255,255,0.05)', border: `1px solid ${step.done ? step.color : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: step.done ? '#000' : 'rgba(255,255,255,0.25)', fontWeight: 700, fontFamily: 'monospace', flexShrink: 0, boxShadow: step.done ? `0 0 12px ${step.color}55` : 'none' }}>
                {step.done ? '✓' : '…'}
              </div>
              {i < steps.length - 1 && <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.05)', margin: '3px 0' }} />}
            </div>
            <div style={{ paddingTop: 5, paddingBottom: i < steps.length - 1 ? 0 : 0 }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0, fontWeight: 600, fontFamily: 'monospace' }}>{step.label}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: '2px 0 18px', fontFamily: 'monospace' }}>{step.desc}</p>
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

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: C.bgDeep,
        paddingTop: 'clamp(80px,12vw,140px)',
        paddingBottom: 'clamp(80px,12vw,140px)',
      }}>
        {/* Gradient mesh */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '70%', height: '100%', background: 'radial-gradient(ellipse at center, rgba(124,108,248,0.18) 0%, transparent 65%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', top: '10%', right: '-5%', width: '55%', height: '80%', background: 'radial-gradient(ellipse at center, rgba(64,192,208,0.15) 0%, transparent 65%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '30%', width: '50%', height: '60%', background: 'radial-gradient(ellipse at center, rgba(10,37,64,0.8) 0%, transparent 70%)' }} />
          {/* Grid overlay */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: 0.5 }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: MAX, margin: '0 auto', padding: '0 clamp(16px,3vw,48px)', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(64,192,208,0.08)', border: '1px solid rgba(64,192,208,0.2)', borderRadius: 100, padding: '5px 14px', marginBottom: 28, fontSize: 12, fontFamily: 'monospace', letterSpacing: '0.08em', color: 'rgba(64,192,208,0.85)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.accent, display: 'inline-block', boxShadow: `0 0 8px ${C.accent}` }} />
            Now in early access · Free to start
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 'clamp(40px,6.5vw,80px)', fontWeight: 700, lineHeight: 1.03, letterSpacing: '-0.04em', color: '#FFFFFF', margin: '0 0 24px', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
            The operating system<br />
            <span style={{ background: 'linear-gradient(90deg, #40C0D0 0%, #7C6CF8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>for serious builders.</span>
          </h1>

          {/* Sub */}
          <p style={{ fontSize: 'clamp(16px,2vw,20px)', lineHeight: 1.6, color: 'rgba(255,255,255,0.55)', margin: '0 auto 40px', maxWidth: '52ch' }}>
            ACCESS unifies your registry, AI memory, projects, CRM, vaults, and
            workflows into one platform that compounds every time you use it.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            <button onClick={startBuilding} style={{ fontSize: 16, fontWeight: 600, color: C.bgDeep, background: '#FFFFFF', border: 'none', borderRadius: 7, padding: '14px 28px', cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 48, boxShadow: '0 4px 24px rgba(255,255,255,0.12)' }}>
              Start for free →
            </button>
            <Link href="/plans" style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.7)', textDecoration: 'none', padding: '14px 28px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(8px)' }}>
              View pricing
            </Link>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', letterSpacing: '0.06em' }}>No credit card required · Free tier always available</p>

          {/* Hero product mockup */}
          <div style={{ marginTop: 64, position: 'relative', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
            <div style={{ position: 'absolute', inset: -2, background: 'linear-gradient(135deg, rgba(124,108,248,0.4), rgba(64,192,208,0.4))', borderRadius: 14, filter: 'blur(12px)', opacity: 0.6 }} />
            <div style={{ position: 'relative', background: '#0B1220', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.7)' }}>
              {/* Browser chrome */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#0D1627' }}>
                {['#FF5F57','#FEBC2E','#28C840'].map((c) => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 5, padding: '4px 12px', marginLeft: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(64,192,208,0.4)' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>app.access · Dashboard</span>
                </div>
              </div>
              {/* Dashboard content */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 280 }}>
                {/* Sidebar */}
                <div style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: '16px 12px', background: '#080E1A' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em' }}>ACCESS</span>
                  </div>
                  {['Dashboard','Registry','Projects','JYSON','Workflows','CRM','Assets','Vaults'].map((item, i) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 5, background: i === 0 ? 'rgba(64,192,208,0.1)' : 'transparent', marginBottom: 2 }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: i === 0 ? C.accent : 'rgba(255,255,255,0.15)' }} />
                      <span style={{ fontSize: 11, color: i === 0 ? C.accent : 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{item}</span>
                    </div>
                  ))}
                </div>
                {/* Main */}
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Active Projects', value: '12', color: C.accent },
                      { label: 'JYSON Sessions', value: '847', color: C.purple },
                      { label: 'Assets Stored', value: '203', color: '#4ABDA0' },
                    ].map((stat) => (
                      <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 14px' }}>
                        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
                        <p style={{ fontSize: 22, fontWeight: 700, color: stat.color, fontFamily: 'monospace', margin: 0 }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '14px' }}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', margin: '0 0 10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Recent Activity</p>
                    {['ACCESS V3 deployed · 31 routes live','Bridge Video project updated · 3 tasks open','Daily Brief workflow ran · 7:00 AM'].map((line, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: [C.accent, '#C9A46A', C.purple][i], flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PROOF BELT ════════════════════════════════════════════════════════ */}
      <section style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '20px clamp(16px,3vw,48px)' }}>
        <div style={{ maxWidth: MAX, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 'clamp(16px,3vw,40px)', flexWrap: 'wrap' }}>
          <p style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.12em', color: C.mute, textTransform: 'uppercase', flexShrink: 0, margin: 0 }}>Built for</p>
          {['Founders','Operators','Creators','Agencies','Nonprofits','Consultants','Churches'].map((item, i, arr) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>{item}</span>
              {i < arr.length - 1 && <span style={{ color: C.border, fontSize: 18, marginLeft: 'clamp(12px,2vw,32px)' }}>·</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ══ PLATFORM OVERVIEW ═════════════════════════════════════════════════ */}
      <section style={{ background: C.bgAlt, padding: 'clamp(64px,10vw,112px) clamp(16px,3vw,48px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: MAX, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontFamily: 'monospace', letterSpacing: '0.12em', color: C.accent, textTransform: 'uppercase', marginBottom: 14 }}>Platform</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: '0 0 16px', lineHeight: 1.1 }}>
              One OS. Every part of your operation.
            </h2>
            <p style={{ fontSize: 17, color: C.sub, lineHeight: 1.65, margin: '0 auto', maxWidth: '52ch' }}>
              Every module is connected. Nothing lives in isolation.
              The more you build, the smarter the system gets.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {[
              { icon: '⬡', title: 'Registry',  color: C.accent,  desc: 'A living database of every system, project, asset, and workflow you\'ve ever built. Query it. Reference it. Build on it.' },
              { icon: '◈', title: 'JYSON',     color: C.purple,  desc: 'Your AI intelligence layer. Not a chatbot — an operator that reads your workspace and compounds context across every session.' },
              { icon: '⬡', title: 'Projects',  color: '#4ABDA0', desc: 'Structured project management with registry integration. Every milestone, deliverable, and client touchpoint tracked.' },
              { icon: '◈', title: 'CRM',        color: '#C9A46A', desc: 'Know your clients, contacts, and relationships. Every conversation, deal stage, and follow-up in one connected record.' },
              { icon: '⬡', title: 'Vaults',    color: C.purple,  desc: 'Encrypted storage for your IP, methodologies, credentials, media, and documents. Organized. Searchable. Yours.' },
              { icon: '◈', title: 'Workflows',  color: C.accent,  desc: 'Trigger-based automation that runs across your modules. Build sequences once — let the system execute.' },
            ].map((f) => (
              <div key={f.title} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.2s' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${f.color}, transparent)` }} />
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${f.color}15`, border: `1px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: f.color, marginBottom: 14, fontFamily: 'monospace' }}>{f.icon}</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>{f.title}</p>
                <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURE: REGISTRY ═════════════════════════════════════════════════ */}
      <section style={{ background: C.bg, padding: 'clamp(64px,9vw,108px) clamp(16px,3vw,48px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: MAX, margin: '0 auto' }}>
          <div className="hp-feature-grid">
            <div>
              <p style={{ fontSize: 12, fontFamily: 'monospace', letterSpacing: '0.12em', color: C.accent, textTransform: 'uppercase', marginBottom: 14 }}>Registry</p>
              <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, color: C.text, margin: '0 0 18px' }}>
                Everything you've built,<br />structured and searchable.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: C.sub, margin: '0 0 28px', maxWidth: '44ch' }}>
                The ACCESS Registry replaces scattered notes, folders, and tools with a living database of everything in your operation. One place to query, reference, and build from.
              </p>
              <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Systems, blueprints, assets, and workflows — all connected','Sub-modules for every object type in your operation','Search, filter, and navigate without losing context'].map((pt) => (
                  <li key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: C.sub, lineHeight: 1.5 }}>
                    <span style={{ color: C.green, fontSize: 12, marginTop: 2, flexShrink: 0, fontWeight: 700 }}>✓</span>
                    {pt}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: C.text, textDecoration: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 18px' }}>
                Explore the Registry →
              </Link>
            </div>
            <div><RegistryVisual /></div>
          </div>
        </div>
      </section>

      {/* ══ FEATURE: JYSON ════════════════════════════════════════════════════ */}
      <section style={{ background: C.bgAlt, padding: 'clamp(64px,9vw,108px) clamp(16px,3vw,48px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: MAX, margin: '0 auto' }}>
          <div className="hp-feature-grid hp-feature-reverse">
            <div><JysonVisual /></div>
            <div>
              <p style={{ fontSize: 12, fontFamily: 'monospace', letterSpacing: '0.12em', color: C.purple, textTransform: 'uppercase', marginBottom: 14 }}>JYSON</p>
              <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, color: C.text, margin: '0 0 18px' }}>
                AI that knows your<br />context and compounds.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: C.sub, margin: '0 0 28px', maxWidth: '44ch' }}>
                JYSON is not a chatbot. It reads your registry, remembers your sessions, and gives you intelligence that builds on everything you've built — not just what you typed today.
              </p>
              <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Full context on your projects, systems, and goals','Session memory that persists across conversations','Proactive recommendations — not just reactive responses'].map((pt) => (
                  <li key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: C.sub, lineHeight: 1.5 }}>
                    <span style={{ color: C.green, fontSize: 12, marginTop: 2, flexShrink: 0, fontWeight: 700 }}>✓</span>
                    {pt}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: C.text, textDecoration: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 18px' }}>
                Try JYSON →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURE: WORKFLOWS ════════════════════════════════════════════════ */}
      <section style={{ background: C.bg, padding: 'clamp(64px,9vw,108px) clamp(16px,3vw,48px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: MAX, margin: '0 auto' }}>
          <div className="hp-feature-grid">
            <div>
              <p style={{ fontSize: 12, fontFamily: 'monospace', letterSpacing: '0.12em', color: C.accent, textTransform: 'uppercase', marginBottom: 14 }}>Workflows</p>
              <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, color: C.text, margin: '0 0 18px' }}>
                Automation that runs<br />when you're not watching.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: C.sub, margin: '0 0 28px', maxWidth: '44ch' }}>
                Build sequences that execute across your registry and external tools. Your operation keeps moving even when you step away.
              </p>
              <ul style={{ listStyle: 'none', margin: '0 0 32px', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Trigger-based automation across all ACCESS modules','Connect external tools and APIs via webhooks','Monitor execution history and output in real time'].map((pt) => (
                  <li key={pt} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: C.sub, lineHeight: 1.5 }}>
                    <span style={{ color: C.green, fontSize: 12, marginTop: 2, flexShrink: 0, fontWeight: 700 }}>✓</span>
                    {pt}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: C.text, textDecoration: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 18px' }}>
                Build a workflow →
              </Link>
            </div>
            <div><WorkflowVisual /></div>
          </div>
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════════════════════ */}
      <section style={{ background: C.bgDeep, padding: 'clamp(64px,9vw,108px) clamp(16px,3vw,48px)', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
        <div style={{ maxWidth: MAX, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '40px 48px' }}>
            {[
              { value: '99.9%', label: 'Uptime SLA',          sub: 'Builder & Enterprise plans' },
              { value: '$0',    label: 'To start',             sub: 'Free tier, no card required' },
              { value: '6',     label: 'Core OS modules',      sub: 'Registry, JYSON, CRM, Vaults, Workflows, Projects' },
              { value: '∞',     label: 'Compounds over time',  sub: 'Every session builds on the last' },
            ].map((s) => (
              <div key={s.value}>
                <p style={{ fontSize: 'clamp(44px,5vw,64px)', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 8px', lineHeight: 1, fontFamily: 'monospace' }}>{s.value}</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px' }}>{s.label}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0, lineHeight: 1.5 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING PREVIEW ════════════════════════════════════════════════════ */}
      <section style={{ background: C.bgAlt, padding: 'clamp(64px,9vw,108px) clamp(16px,3vw,48px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: MAX, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontFamily: 'monospace', letterSpacing: '0.12em', color: C.accent, textTransform: 'uppercase', marginBottom: 14 }}>Pricing</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 700, letterSpacing: '-0.03em', color: C.text, margin: '0 0 16px' }}>Simple, transparent pricing.</h2>
            <p style={{ fontSize: 17, color: C.sub, margin: '0 auto', maxWidth: '44ch', lineHeight: 1.6 }}>Start free. Upgrade when you're ready to unlock the full operating system.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16, maxWidth: 860, margin: '0 auto' }}>
            {[
              { name: 'Personal', price: '$29', sub: '/month', highlight: false, desc: 'For individuals building their first system.', features: ['100 JYSON messages/month','Registry + Projects','Assets + Vaults','Community support'] },
              { name: 'Builder',  price: '$99', sub: '/month', highlight: true,  desc: 'Full platform access for serious operators.', features: ['1,000 JYSON messages/month','Everything in Personal','CRM + Workflows + Offers','14-day free trial'] },
              { name: 'Enterprise', price: '$299', sub: '/month', highlight: false, desc: 'Teams and organizations building at scale.', features: ['Unlimited JYSON messages','Multi-seat access','API access','Dedicated onboarding'] },
            ].map((plan) => (
              <div key={plan.name} style={{ background: plan.highlight ? C.bgDark : C.bg, border: plan.highlight ? `2px solid ${C.accent}` : `1px solid ${C.border}`, borderRadius: 12, padding: '28px 24px', position: 'relative' }}>
                {plan.highlight && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: C.accent, color: C.bgDark, fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 100, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>Most popular</div>}
                <p style={{ fontSize: 14, fontWeight: 700, color: plan.highlight ? 'rgba(255,255,255,0.6)' : C.mute, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }}>{plan.name}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 8 }}>
                  <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.04em', color: plan.highlight ? '#fff' : C.text, lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: plan.highlight ? 'rgba(255,255,255,0.4)' : C.mute }}>{plan.sub}</span>
                </div>
                <p style={{ fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,0.5)' : C.sub, margin: '0 0 20px', lineHeight: 1.5 }}>{plan.desc}</p>
                <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: plan.highlight ? 'rgba(255,255,255,0.65)' : C.sub }}>
                      <span style={{ color: plan.highlight ? C.accent : C.green, fontWeight: 700, fontSize: 11 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === 'Enterprise' ? '/contact' : '/sign-up'} style={{ display: 'block', textAlign: 'center', background: plan.highlight ? C.accent : 'transparent', color: plan.highlight ? C.bgDark : C.text, border: plan.highlight ? 'none' : `1px solid ${C.border}`, borderRadius: 7, padding: '11px 0', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  {plan.name === 'Enterprise' ? 'Contact sales' : plan.name === 'Builder' ? 'Start free trial' : 'Get started'}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: C.mute, marginTop: 24 }}>
            Annual billing saves ~17% · <Link href="/plans" style={{ color: C.accent, textDecoration: 'none' }}>See full plan comparison →</Link>
          </p>
        </div>
      </section>

      {/* ══ SECURITY STRIP ════════════════════════════════════════════════════ */}
      <section style={{ background: C.bg, padding: 'clamp(40px,6vw,72px) clamp(16px,3vw,48px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: MAX, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontFamily: 'monospace', letterSpacing: '0.12em', color: C.mute, textTransform: 'uppercase', marginBottom: 28 }}>Security & compliance</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'clamp(16px,3vw,40px)', flexWrap: 'wrap' }}>
            {[
              { label: 'TLS 1.3', sub: 'In transit' },
              { label: 'AES-256', sub: 'At rest' },
              { label: 'PCI-DSS', sub: 'Stripe payments' },
              { label: 'NACHA', sub: 'ACH transfers' },
              { label: 'FIPA', sub: 'FL compliant' },
              { label: 'FDBR', sub: 'Data rights' },
            ].map((b) => (
              <div key={b.label} style={{ textAlign: 'center', padding: '12px 16px', border: `1px solid ${C.border}`, borderRadius: 8, minWidth: 90 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 3px', fontFamily: 'monospace' }}>{b.label}</p>
                <p style={{ fontSize: 10, color: C.mute, margin: 0, letterSpacing: '0.04em' }}>{b.sub}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: C.mute, marginTop: 20 }}>
            <Link href="/security" style={{ color: C.accent, textDecoration: 'none' }}>Read our full security documentation →</Link>
          </p>
        </div>
      </section>

      {/* ══ FINAL CTA ═════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', background: C.bgDeep, padding: 'clamp(80px,12vw,140px) clamp(16px,3vw,48px)' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-30%', left: '-10%', width: '60%', height: '120%', background: 'radial-gradient(ellipse, rgba(124,108,248,0.15) 0%, transparent 65%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '50%', height: '100%', background: 'radial-gradient(ellipse, rgba(64,192,208,0.12) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(32px,5vw,60px)', fontWeight: 700, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 20px', lineHeight: 1.06 }}>
            Your operation deserves<br />real infrastructure.
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 auto 40px', maxWidth: '48ch' }}>
            Start for free. Build in minutes. The system compounds every time you use it.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={startBuilding} style={{ fontSize: 16, fontWeight: 600, color: C.bgDeep, background: '#FFFFFF', border: 'none', borderRadius: 7, padding: '14px 32px', cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 48, boxShadow: '0 4px 24px rgba(255,255,255,0.1)' }}>
              Start for free →
            </button>
            <Link href="/contact" style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', padding: '14px 28px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, display: 'inline-flex', alignItems: 'center' }}>
              Talk to us
            </Link>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 20, fontFamily: 'monospace' }}>No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════════ */}
      <footer style={{ background: C.bgDark, borderTop: '1px solid rgba(255,255,255,0.08)', padding: 'clamp(48px,6vw,80px) clamp(16px,3vw,48px) clamp(24px,3vw,40px)' }}>
        <div style={{ maxWidth: MAX, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 'clamp(32px,4vw,56px)', marginBottom: 56 }}>

            <div style={{ gridColumn: 'span 1' }}>
              <p style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: '0.12em', marginBottom: 12 }}>ACCESS</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 20 }}>The AI operating system for founders, creators, and operators.</p>
              <Link href="/sign-up" style={{ display: 'inline-block', background: C.accent, color: C.bgDark, padding: '9px 18px', borderRadius: 7, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Get started free</Link>
            </div>

            {[
              { label: 'Platform', links: [['JYSON','/jyson'],['Registry','/registry'],['Projects','/projects'],['Customers','/customers'],['Assets','/assets'],['Vaults','/vaults'],['Workflows','/workflows'],['Offers','/offers'],['Memory','/memory'],['Terminal','/terminal'],['Blueprints','/blueprints']] },
              { label: 'Solutions', links: [['For Founders','/solutions/founders'],['For Agencies','/solutions/agencies'],['For Creators','/solutions/creators'],['For Nonprofits','/solutions/nonprofits'],['For Consultants','/solutions/consultants'],['For Churches','/solutions/churches'],['Enterprise','/plans'],['Compare plans','/compare']] },
              { label: 'Resources', links: [['Documentation','/docs'],['Help Center','/help'],['Changelog','/changelog'],['Platform status','/status'],['Security','/security'],['Blog','/blog']] },
              { label: 'Company',   links: [['About ACCESS','/about'],['Careers','/careers'],['Contact','/contact'],['Plans & Pricing','/plans']] },
              { label: 'Legal',     links: [['Terms of Service','/terms'],['Privacy Policy','/privacy'],['Acceptable Use','/acceptable-use'],['Cookie Policy','/cookies'],['Security','/security']] },
            ].map((col) => (
              <div key={col.label}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16, fontFamily: 'monospace' }}>{col.label}</p>
                {col.links.map(([l, h]) => (
                  <Link key={l} href={h} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', marginBottom: 8, lineHeight: 1.4 }}>{l}</Link>
                ))}
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', margin: 0 }}>© 2026 JD AI Systems, LLC · Tampa, FL · Atlanta, GA</p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[['Terms','/terms'],['Privacy','/privacy'],['Acceptable Use','/acceptable-use'],['Cookies','/cookies']].map(([l, h]) => (
                <Link key={l} href={h} style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .hp-feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(40px, 6vw, 96px);
          align-items: center;
        }
        .hp-feature-reverse > *:first-child { order: 1; }
        .hp-feature-reverse > *:last-child  { order: 0; }
        @media (max-width: 767px) {
          .hp-feature-grid { grid-template-columns: 1fr !important; }
          .hp-feature-grid > * { order: unset !important; }
        }
      `}</style>
    </AccessMarketingLayout>
  )
}
