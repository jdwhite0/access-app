'use client'

import Link from 'next/link'
import AccessMarketingLayout from '@/components/marketing/AccessMarketingLayout'
import PublicHeader from '@/components/marketing/PublicHeader'
import GradientMeshHero from '@/components/marketing/GradientMeshHero'
import { MarketingCTAButton, MarketingCTALink } from '@/components/marketing/MarketingCTA'
import { useMarketingAuthActions } from '@/components/marketing/useMarketingAuthActions'

const BENTO = [
  { icon: '◈', title: 'Registry', body: 'Every project, system, asset, and workflow in one structured layer. Not a folder — a living database of what you\'ve built.', tag: 'Infrastructure', span: 2 },
  { icon: '⬡', title: 'JYSON AI', body: 'Your AI guide that knows your context, remembers your decisions, and compounds with you over time.', tag: 'Intelligence', span: 1 },
  { icon: '◉', title: 'Memory', body: 'Nothing starts over. Every insight, preference, and pattern persists across sessions.', tag: 'Persistence', span: 1 },
  { icon: '⬧', title: 'Projects', body: 'Ship real things. Track progress, link systems, connect offers — from idea to compounding asset.', tag: 'Execution', span: 1 },
  { icon: '▣', title: 'Vaults', body: 'Secure knowledge stores for your IP, research, playbooks, and frameworks. What you know becomes infrastructure.', tag: 'Storage', span: 1 },
  { icon: '◎', title: 'Workflows', body: 'Automated sequences that run without you. Systems that work while you sleep.', tag: 'Automation', span: 1 },
] as const

const METRICS = [
  { value: '10×', label: 'faster context retrieval vs scattered notes' },
  { value: '$0', label: 'to start — free forever on the base tier' },
  { value: '99.9%', label: 'uptime SLA on Builder and Operator plans' },
  { value: '∞', label: 'compounds — smarter every session' },
]

const HOW = [
  { step: '01', title: 'Plant your registry', body: 'Describe what you\'re building. ACCESS structures it — projects, assets, systems — in a living database that connects everything.' },
  { step: '02', title: 'Let JYSON guide', body: 'Ask what to do next. Shape decisions. Build offers. JYSON has full context on your work and compounds with every session.' },
  { step: '03', title: 'Deploy and compound', body: 'Ship products, automate workflows, connect tools. What you build in ACCESS becomes infrastructure that generates without you.' },
]

function DashboardPreview() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0f0a1a 50%, #0a0f0a 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: 24,
      fontFamily: 'var(--mono)',
      fontSize: 12,
      color: 'rgba(240,240,240,0.6)',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 320,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#40C0D0', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em' }}>ACCESS</span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>/</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Dashboard</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5F56' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFBD2E' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27C93F' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { label: 'Projects', value: '12', color: '#40C0D0' },
          { label: 'Registry', value: '47', color: '#7C6CF8' },
          { label: 'JYSON', value: '284', color: '#C9A46A' },
          { label: 'Plan', value: 'Builder', color: '#4ABDA0' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '10px 12px' }}>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>{s.label}</p>
            <p style={{ fontSize: 18, fontWeight: 600, color: s.color, margin: '4px 0 0' }}>{s.value}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { action: 'JYSON chat', detail: 'Revenue strategy reviewed', time: '2m ago', color: '#40C0D0' },
          { action: 'Registry write', detail: 'Bridge Video — V1 planted', time: '1h ago', color: '#7C6CF8' },
          { action: 'Workflow run', detail: 'Daily brief generated', time: '8h ago', color: '#4ABDA0' },
        ].map((row) => (
          <div key={row.action} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 5, border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: row.color, flexShrink: 0, display: 'inline-block' }} />
              <span style={{ color: 'rgba(240,240,240,0.75)', fontSize: 11 }}>{row.action}</span>
              <span style={{ color: 'rgba(240,240,240,0.35)', fontSize: 11 }}>— {row.detail}</span>
            </div>
            <span style={{ color: 'rgba(240,240,240,0.25)', fontSize: 10 }}>{row.time}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(64,192,208,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
    </div>
  )
}

export default function PublicHomePage() {
  const { startBuilding } = useMarketingAuthActions()

  return (
    <AccessMarketingLayout>
      <PublicHeader />

      {/* Hero */}
      <section aria-labelledby="hero-heading" style={{ position: 'relative', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#030008' }}>
        <GradientMeshHero />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: 'clamp(100px, 14vw, 160px) clamp(20px, 5vw, 60px)', maxWidth: 880, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(64,192,208,0.1)', border: '1px solid rgba(64,192,208,0.25)', borderRadius: 100, padding: '5px 14px', marginBottom: 32, fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.12em', color: '#40C0D0' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#40C0D0', display: 'inline-block' }} />
            SYSTEM ONLINE
          </div>
          <h1 id="hero-heading" style={{ fontSize: 'clamp(48px, 7.5vw, 92px)', fontWeight: 700, lineHeight: 1.0, letterSpacing: '-0.04em', color: '#ffffff', margin: '0 0 24px' }}>
            Build systems.
            <br />
            <span style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #C41E3A 50%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Compound forever.
            </span>
          </h1>
          <p style={{ fontSize: 'clamp(17px, 2vw, 21px)', color: 'rgba(240,240,240,0.7)', lineHeight: 1.55, maxWidth: 540, margin: '0 auto 40px' }}>
            ACCESS is the operating system for builders — registry, AI memory, workflows,
            and intelligence in one platform that gets smarter as you build.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <MarketingCTAButton variant="accent" onClick={startBuilding}>Start building — free</MarketingCTAButton>
            <MarketingCTALink href="/plans" variant="secondary">View plans</MarketingCTALink>
          </div>
          <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(240,240,240,0.3)', fontFamily: 'var(--mono)' }}>No credit card required · Free forever on the base tier</p>
        </div>
        <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.22)', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.1em', zIndex: 10 }}>
          <span>SCROLL</span>
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)' }} />
        </div>
      </section>

      {/* Metrics band */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: 'clamp(32px, 5vw, 48px) clamp(20px, 5vw, 60px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
          {METRICS.map((m) => (
            <div key={m.value} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', margin: 0, fontFamily: 'var(--mono)' }}>{m.value}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 0', lineHeight: 1.4 }}>{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bento grid */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 5vw, 60px)', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ maxWidth: 540, marginBottom: 'clamp(48px, 7vw, 72px)' }}>
          <p style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 14 }}>Platform modules</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, color: 'var(--text)', margin: '0 0 16px' }}>
            Everything you need.<br />Nothing you don&apos;t.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-dim)', lineHeight: 1.6, maxWidth: '42ch' }}>
            Built for founders, builders, and operators who are serious about turning ideas into compounding systems.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {BENTO.map((item, i) => (
            <div key={item.title} style={{
              gridColumn: i === 0 ? 'span 2' : 'span 1',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 'clamp(24px, 3vw, 32px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 20, color: 'var(--accent)' }}>{item.icon}</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: 3, textTransform: 'uppercase' }}>{item.tag}</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product screenshot */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 5vw, 60px)', maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'clamp(40px, 6vw, 80px)', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16 }}>Dashboard</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--text)', margin: '0 0 16px' }}>
            Your command center,<br />not a to-do list.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-dim)', lineHeight: 1.65, marginBottom: 28 }}>
            See your entire operation at a glance — registry health, JYSON activity,
            project pipeline, and plan status in one clean view designed for operators.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            {['Stat cards with live data from your registry', 'JYSON chat inline — context-aware, never cold', 'Activity feed across all modules', 'One-click access to every system you\'ve built'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ color: 'var(--success)', fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
          <MarketingCTAButton variant="accent" onClick={startBuilding}>Open your dashboard</MarketingCTAButton>
        </div>
        <DashboardPreview />
      </section>

      {/* How it works */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 5vw, 60px)', background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 7vw, 72px)' }}>
            <p style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 16 }}>How it works</p>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, color: 'var(--text)', margin: 0 }}>
              Three steps from idea to income.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {HOW.map((step) => (
              <div key={step.step} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 'clamp(28px, 4vw, 40px)' }}>
                <p style={{ fontSize: 11, fontFamily: 'var(--mono)', letterSpacing: '0.14em', color: 'var(--text-muted)', marginBottom: 16, textTransform: 'uppercase' }}>{step.step}</p>
                <h3 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)', margin: '0 0 12px' }}>{step.title}</h3>
                <p style={{ fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.65, margin: 0 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans CTA */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 5vw, 60px)', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 7vw, 72px)' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, color: 'var(--text)', margin: '0 0 16px' }}>Start free. Scale when ready.</h2>
          <p style={{ fontSize: 17, color: 'var(--text-dim)', maxWidth: '44ch', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Free forever on the base tier. Upgrade when you need more power, deeper intelligence, or automated infrastructure.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <MarketingCTAButton variant="accent" onClick={startBuilding}>Get started free</MarketingCTAButton>
            <MarketingCTALink href="/plans" variant="secondary">Compare all plans</MarketingCTALink>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, maxWidth: 860, margin: '0 auto' }}>
          {[
            { name: 'Free', price: '$0', desc: 'Core registry, 50 JYSON messages/month, 5 objects.', cta: 'Start free', highlight: false, launchNote: null, originalPrice: null },
            { name: 'Operator', price: '$149', originalPrice: '$299', period: '/mo', desc: 'Start building with ACCESS. Full JYSON, registry, projects, blueprints.', cta: 'Start Operator', highlight: false, launchNote: '50% founder launch discount applied.' },
            { name: 'Builder', price: '$299', originalPrice: '$599', period: '/mo', desc: 'Build systems, workflows, and infrastructure. Full AI intelligence stack.', cta: 'Start Builder', highlight: true, launchNote: '50% founder launch discount applied.' },
          ].map((plan) => (
            <div key={plan.name} style={{ background: plan.highlight ? 'var(--accent-glow)' : 'var(--surface)', border: `1px solid ${plan.highlight ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 10, padding: 24, position: 'relative' }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.1em', padding: '3px 12px', borderRadius: 100, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Most popular</div>
              )}
              <p style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-muted)', margin: '0 0 8px', letterSpacing: '0.06em' }}>{plan.name}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)' }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{plan.period}</span>}
                {plan.originalPrice && <span style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{plan.originalPrice}</span>}
              </div>
              {plan.launchNote && <p style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 10 }}>{plan.launchNote}</p>}
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.55, marginBottom: 16 }}>{plan.desc}</p>
              <button onClick={startBuilding} style={{ width: '100%', padding: '10px', borderRadius: 6, border: plan.highlight ? 'none' : '1px solid var(--border)', background: plan.highlight ? 'var(--accent)' : 'transparent', color: plan.highlight ? 'var(--on-accent)' : 'var(--text)', fontSize: 13, fontFamily: 'var(--mono)', cursor: 'pointer', letterSpacing: '0.04em' }}>
                {plan.cta} →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: 'clamp(80px, 10vw, 120px) clamp(20px, 5vw, 60px)', background: 'var(--surface)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08, color: 'var(--text)', margin: '0 0 16px' }}>
            The builders who win<br />build systems, not tasks.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 32 }}>
            Stop managing ideas in notes and DMs. Start building infrastructure that compounds.
          </p>
          <MarketingCTAButton variant="accent" onClick={startBuilding}>Open ACCESS — free</MarketingCTAButton>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: 'clamp(28px, 4vw, 40px) clamp(20px, 5vw, 60px)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)', letterSpacing: '0.12em' }}>ACCESS</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>by JD Productions</span>
        </div>
        <nav style={{ display: 'flex', gap: 20 }}>
          {[{ label: 'Plans', href: '/plans' }, { label: 'Dashboard', href: '/dashboard' }, { label: 'Status', href: '/status' }, { label: 'Contact', href: '/contact' }].map((l) => (
            <Link key={l.label} href={l.href} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>{l.label}</Link>
          ))}
        </nav>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)', margin: 0 }}>© 2026 JD Productions Inc.</p>
      </footer>
    </AccessMarketingLayout>
  )
}
