import Link from 'next/link'

export const metadata = {
  title: 'About — ACCESS by JD AI Systems',
  description: 'JD AI Systems builds operating infrastructure for founders, creators, agencies, and operators. Based in Tampa, Florida.',
}

const C = {
  bg:     '#FFFFFF',
  bgAlt:  '#F7F9FC',
  bgDark: '#0A2540',
  text:   '#0A2540',
  sub:    '#425466',
  mute:   '#697386',
  border: '#E6EBF1',
  accent: '#40C0D0',
} as const

export default function AboutPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      {/* Nav */}
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: '0 clamp(16px,3vw,48px)', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
        <Link href="/" style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textDecoration: 'none' }}>ACCESS</Link>
        <nav style={{ display: 'flex', gap: 24, marginLeft: 'auto' }}>
          {[['Plans', '/plans'], ['Compare', '/compare'], ['Sign in', '/sign-in']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 14, color: C.sub, textDecoration: 'none' }}>{l}</Link>
          ))}
          <Link href="/sign-up" style={{ fontSize: 14, background: C.bgDark, color: '#fff', padding: '7px 16px', borderRadius: 6, textDecoration: 'none' }}>Get ACCESS</Link>
        </nav>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px,8vw,96px) clamp(16px,3vw,48px) 0' }}>
        <p style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em', color: C.accent, marginBottom: 16, textTransform: 'uppercase' }}>About ACCESS</p>
        <h1 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, color: C.text, lineHeight: 1.1, margin: '0 0 24px' }}>
          We build operating infrastructure for the people building the future.
        </h1>
        <p style={{ fontSize: 18, color: C.sub, lineHeight: 1.7, margin: '0 0 16px' }}>
          ACCESS is the product of JD AI Systems, LLC — a technology company headquartered in Tampa, Florida,
          with a second base forming in Atlanta, Georgia. We build AI-powered tools that replace
          the friction between ambition and execution.
        </p>
        <p style={{ fontSize: 16, color: C.mute, lineHeight: 1.7 }}>
          Most operating tools were built for enterprises with operations teams. ACCESS was built for
          founders who are the operations team — and for every creator, consultant, agency, nonprofit,
          and operator who runs complex work from a single seat.
        </p>
      </section>

      {/* Mission */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px,6vw,80px) clamp(16px,3vw,48px)' }}>
        <div style={{ background: C.bgDark, borderRadius: 16, padding: 'clamp(32px,4vw,56px)' }}>
          <p style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em', color: C.accent, marginBottom: 16, textTransform: 'uppercase' }}>The mission</p>
          <p style={{ fontSize: 'clamp(20px,2.5vw,28px)', color: '#fff', lineHeight: 1.5, fontWeight: 600, margin: 0 }}>
            Transfer the power of a full operating system to every person with something real to build — regardless of team size, budget, or technical background.
          </p>
        </div>
      </section>

      {/* What we build */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(16px,3vw,48px) clamp(48px,6vw,80px)' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 12 }}>What we build</h2>
        <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.7, marginBottom: 40, maxWidth: 600 }}>
          ACCESS is a single platform that gives you the operating infrastructure most operators piece together across 5–10 separate tools.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
          {[
            { name: 'JYSON', desc: 'Your AI layer. Knows your workspace, remembers sessions, and compounds intelligence over time.' },
            { name: 'Registry', desc: 'A living database of every system, asset, project, and blueprint in your operation.' },
            { name: 'Projects', desc: 'End-to-end project management with full context from your registry.' },
            { name: 'Customers', desc: 'CRM built for operators — track contacts, pipelines, and relationships in one place.' },
            { name: 'Vaults', desc: 'Encrypted, organized storage for sensitive documents, credentials, and knowledge.' },
            { name: 'Workflows', desc: 'Automation sequences that run across your platform when you\'re not watching.' },
            { name: 'Offers', desc: 'Build, manage, and track the products and services you sell.' },
            { name: 'Memory', desc: 'Long-term workspace memory that JYSON reads to stay in context across sessions.' },
          ].map((f) => (
            <div key={f.name} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <p style={{ fontFamily: 'monospace', fontSize: 13, color: C.accent, marginBottom: 8, fontWeight: 700 }}>{f.name}</p>
              <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who we serve */}
      <section style={{ background: C.bgAlt, padding: 'clamp(48px,6vw,80px) clamp(16px,3vw,48px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 40, textAlign: 'center' }}>Built for operators of all kinds</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {['Founders', 'Creators', 'Agencies', 'Consultants', 'Nonprofits', 'Churches', 'Coaches', 'Operators', 'Teams', 'Builders', 'Freelancers', 'Side hustlers'].map((t) => (
              <div key={t} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center', fontSize: 14, color: C.text, fontWeight: 500 }}>{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Company info */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px,6vw,80px) clamp(16px,3vw,48px)' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: C.text, marginBottom: 32 }}>Company</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[
            { label: 'Legal name', value: 'JD AI Systems, LLC' },
            { label: 'Founded', value: '2026' },
            { label: 'Primary headquarters', value: 'Tampa, Florida' },
            { label: 'Secondary headquarters', value: 'Atlanta, Georgia (2026)' },
            { label: 'Primary product', value: 'ACCESS' },
            { label: 'Contact', value: 'support@jdwhite.world' },
          ].map((r) => (
            <div key={r.label} style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 16 }}>
              <p style={{ fontSize: 12, color: C.mute, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{r.label}</p>
              <p style={{ fontSize: 15, color: C.text, margin: 0, fontWeight: 500 }}>{r.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: C.bgDark, padding: 'clamp(48px,6vw,80px) clamp(16px,3vw,48px)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', color: '#fff', fontWeight: 700, marginBottom: 16 }}>Start building your operating system.</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 32 }}>Free to start. No credit card required.</p>
        <Link href="/sign-up" style={{ background: C.accent, color: C.bgDark, padding: '14px 32px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
          Get ACCESS — Free
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '24px clamp(16px,3vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.mute }}>© 2026 JD AI Systems, LLC · Tampa, FL</span>
        <nav style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Security', '/security'], ['Contact', '/contact']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: C.mute, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
