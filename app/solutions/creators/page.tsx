import Link from 'next/link'

export const metadata = {
  title: 'ACCESS for Creators — Your creative operation, structured.',
  description: 'ACCESS helps creators organize their work, manage brand deals, track projects, and build with JYSON intelligence.',
}

const C = { bg: '#FFFFFF', bgAlt: '#F7F9FC', bgDark: '#0A2540', text: '#0A2540', sub: '#425466', mute: '#697386', border: '#E6EBF1', accent: '#40C0D0' } as const

export default function CreatorsPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: '0 clamp(16px,3vw,48px)', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
        <Link href="/" style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textDecoration: 'none' }}>ACCESS</Link>
        <nav style={{ display: 'flex', gap: 24, marginLeft: 'auto' }}>
          {[['Plans', '/plans'], ['Sign in', '/sign-in']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 14, color: C.sub, textDecoration: 'none' }}>{l}</Link>
          ))}
          <Link href="/sign-up" style={{ fontSize: 14, background: C.bgDark, color: '#fff', padding: '7px 16px', borderRadius: 6, textDecoration: 'none' }}>Get ACCESS</Link>
        </nav>
      </header>

      <section style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(48px,8vw,96px) clamp(16px,3vw,48px) clamp(32px,4vw,56px)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em', color: C.accent, marginBottom: 16, textTransform: 'uppercase' }}>ACCESS for Creators</p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 700, color: C.text, lineHeight: 1.1, margin: '0 0 24px' }}>
          Your creative work is a business. Run it like one.
        </h1>
        <p style={{ fontSize: 18, color: C.sub, lineHeight: 1.7, margin: '0 0 36px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          Brand deals, content pipelines, digital products, community, partnerships — creators run complex operations with no operational infrastructure. ACCESS changes that.
        </p>
        <Link href="/sign-up" style={{ background: C.bgDark, color: '#fff', padding: '14px 32px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
          Start free — Personal plan $29/mo
        </Link>
      </section>

      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: 'clamp(40px,5vw,64px) clamp(16px,3vw,48px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { title: 'Brand deal tracker', body: 'Log every partnership, deliverable, deadline, and rate in your CRM. No more lost emails.' },
              { title: 'Content registry', body: 'Every idea, series, format, and piece of content catalogued in your registry. JYSON can surface what to build on next.' },
              { title: 'Digital product vault', body: 'Store course content, templates, downloads, and intellectual property with vault encryption.' },
              { title: 'Revenue offers', body: 'Build and manage your offers — merch, courses, consulting, memberships — in one place.' },
              { title: 'JYSON as your strategist', body: 'Ask JYSON what to create next based on your goals, content history, and audience. It knows your work.' },
              { title: 'Workflow automation', body: 'Automate content publishing prep, client onboarding, and recurring creator tasks.' },
            ].map((f) => (
              <div key={f.title} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                <p style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>{f.title}</p>
                <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.6, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: C.bgDark, padding: 'clamp(48px,6vw,80px) clamp(16px,3vw,48px)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, color: '#fff', fontWeight: 700, marginBottom: 12 }}>Start at $29. Grow to Builder when you need it.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginBottom: 32 }}>Personal plan covers most creators. Upgrade to Builder at $99/mo for unlimited projects, CRM, and full JYSON intelligence.</p>
        <Link href="/sign-up" style={{ background: C.accent, color: C.bgDark, padding: '14px 32px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
          Get ACCESS free
        </Link>
      </section>

      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '24px clamp(16px,3vw,48px)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.mute }}>© 2026 JD AI Systems, LLC</span>
        <nav style={{ display: 'flex', gap: 20 }}>
          {[['Founders', '/solutions/founders'], ['Nonprofits', '/solutions/nonprofits'], ['Plans', '/plans']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: C.mute, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
