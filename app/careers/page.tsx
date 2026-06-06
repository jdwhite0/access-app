import Link from 'next/link'

export const metadata = {
  title: 'Careers — ACCESS · JD AI Systems',
  description: 'Build the operating infrastructure of the future. Join JD AI Systems in Tampa, FL.',
}

const C = { bg: '#FFFFFF', bgAlt: '#F7F9FC', bgDark: '#0A2540', text: '#0A2540', sub: '#425466', mute: '#697386', border: '#E6EBF1', accent: '#40C0D0' } as const

export default function CareersPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      <header style={{ borderBottom: `1px solid ${C.border}`, padding: '0 clamp(16px,3vw,48px)', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
        <Link href="/" style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textDecoration: 'none' }}>ACCESS</Link>
        <nav style={{ display: 'flex', gap: 24, marginLeft: 'auto' }}>
          {[['About', '/about'], ['Contact', '/contact']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 14, color: C.sub, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </header>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px,8vw,96px) clamp(16px,3vw,48px) clamp(32px,4vw,56px)' }}>
        <p style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em', color: C.accent, marginBottom: 16, textTransform: 'uppercase' }}>Careers</p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: C.text, lineHeight: 1.1, margin: '0 0 24px' }}>
          Build infrastructure for the people building the future.
        </h1>
        <p style={{ fontSize: 18, color: C.sub, lineHeight: 1.7, margin: 0 }}>
          JD AI Systems is a small, focused team building ACCESS — the operating platform for founders,
          operators, and creators. We&apos;re based in Tampa, Florida, expanding to Atlanta, Georgia in 2026.
          We move fast, build with intention, and don&apos;t waste time.
        </p>
      </section>

      {/* Values */}
      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: 'clamp(40px,5vw,64px) clamp(16px,3vw,48px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 32, textAlign: 'center' }}>How we work</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
            {[
              { title: 'Builder-first', body: 'We build before we theorize. If you need months of planning before shipping, this isn\'t the right fit.' },
              { title: 'Context-driven', body: 'We document our decisions. Every choice has a reason. We don\'t do things because that\'s how things are done.' },
              { title: 'Operator mentality', body: 'We eat our own cooking. We run operations on ACCESS. The team are the first and most critical users.' },
              { title: 'No politics', body: 'Small team, direct communication. If something is wrong, say it. We don\'t have the bandwidth for organizational theater.' },
            ].map((v) => (
              <div key={v.title} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                <p style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>{v.title}</p>
                <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.6, margin: 0 }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px,6vw,80px) clamp(16px,3vw,48px)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>Open roles</h2>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.7, marginBottom: 40 }}>
          We&apos;re an early-stage team. Every hire matters. We&apos;re not hiring for titles — we&apos;re hiring for leverage.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { role: 'Full-Stack Engineer', type: 'Full-time · Remote (US)', desc: 'Next.js, TypeScript, Supabase, AI integrations. You ship features end-to-end — frontend through database. Strong product instinct required.' },
            { role: 'AI/ML Engineer', type: 'Full-time · Remote (US)', desc: 'Extend JYSON — retrieval, memory, context management, tool use. Deep knowledge of LLM application patterns and vector infrastructure.' },
            { role: 'Product Designer', type: 'Full-time · Remote (US)', desc: 'Own the ACCESS design language. We have a strong direction; we need someone to push it further without losing the precision.' },
            { role: 'Growth & Partnerships', type: 'Full-time · Tampa, FL preferred', desc: 'Creator, founder, and operator ecosystem. You understand the audience we serve because you are the audience.' },
          ].map((r) => (
            <div key={r.role} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: C.text, fontSize: 16, marginBottom: 4 }}>{r.role}</p>
                <p style={{ fontSize: 12, color: C.accent, fontFamily: 'monospace', marginBottom: 10 }}>{r.type}</p>
                <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.6, margin: 0 }}>{r.desc}</p>
              </div>
              <a
                href={`mailto:support@jdwhite.world?subject=Application: ${r.role}`}
                style={{ background: C.bgDark, color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                Apply →
              </a>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 32, fontSize: 14, color: C.mute, lineHeight: 1.7 }}>
          Don&apos;t see your role? We&apos;re always interested in exceptional people.{' '}
          <a href="mailto:support@jdwhite.world?subject=General Inquiry" style={{ color: C.accent }}>
            Send us a note.
          </a>
        </p>
      </section>

      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '24px clamp(16px,3vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.mute }}>© 2026 JD AI Systems, LLC · Tampa, FL</span>
        <nav style={{ display: 'flex', gap: 20 }}>
          {[['About', '/about'], ['Terms', '/terms'], ['Privacy', '/privacy']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: C.mute, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
