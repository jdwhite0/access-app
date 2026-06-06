import Link from 'next/link'

export const metadata = {
  title: 'ACCESS for Agencies — Client work, systems, and intelligence in one place',
  description: 'ACCESS gives agencies the infrastructure to manage multiple clients, projects, and deliverables without losing context.',
}

const C = { bg: '#FFFFFF', bgAlt: '#F7F9FC', bgDark: '#0A2540', text: '#0A2540', sub: '#425466', mute: '#697386', border: '#E6EBF1', accent: '#40C0D0' } as const

export default function AgenciesPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: '0 clamp(16px,3vw,48px)', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
        <Link href="/" style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textDecoration: 'none' }}>ACCESS</Link>
        <nav style={{ display: 'flex', gap: 24, marginLeft: 'auto' }}>
          {[['Plans', '/plans'], ['Compare', '/compare'], ['Sign in', '/sign-in']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 14, color: C.sub, textDecoration: 'none' }}>{l}</Link>
          ))}
          <Link href="/sign-up" style={{ fontSize: 14, background: C.bgDark, color: '#fff', padding: '7px 16px', borderRadius: 6, textDecoration: 'none' }}>Get ACCESS</Link>
        </nav>
      </header>

      <section style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(48px,8vw,96px) clamp(16px,3vw,48px) clamp(32px,4vw,56px)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em', color: C.accent, marginBottom: 16, textTransform: 'uppercase' }}>ACCESS for Agencies</p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 700, color: C.text, lineHeight: 1.1, margin: '0 0 24px' }}>
          Manage every client, every project, every deliverable — without losing context.
        </h1>
        <p style={{ fontSize: 18, color: C.sub, lineHeight: 1.7, margin: '0 0 36px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          Agency work is context-switching by design. ACCESS gives you a structured operating layer — registry, CRM, projects, assets, and JYSON — that holds context across every client so you don&apos;t have to.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up" style={{ background: C.bgDark, color: '#fff', padding: '13px 28px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>Start free trial</Link>
          <Link href="/contact" style={{ background: C.bgAlt, color: C.text, padding: '13px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: `1px solid ${C.border}` }}>Talk to us — Enterprise</Link>
        </div>
      </section>

      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: 'clamp(40px,5vw,64px) clamp(16px,3vw,48px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 32, textAlign: 'center' }}>Built for how agencies actually work</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { title: 'Client registry', body: 'One registry entry per client. Systems, SOPs, contracts, contacts, and history — all in one structured object.' },
              { title: 'Multi-project management', body: 'Unlimited projects on Builder. Each project is connected to registry objects and client CRM records.' },
              { title: 'Deliverable tracking', body: 'Track what was promised, what\'s in progress, and what\'s done — without living in a spreadsheet.' },
              { title: 'Asset management', body: 'Creative files, brand assets, client media — uploaded once and referenced anywhere in your workspace.' },
              { title: 'JYSON as account manager', body: 'Ask JYSON to summarize where a client is, what\'s overdue, or what needs attention today. It reads your full workspace.' },
              { title: 'Offers and proposals', body: 'Build proposals, retainers, and one-time project offers inside the same platform you use to deliver the work.' },
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
        <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', color: '#fff', fontWeight: 700, marginBottom: 12 }}>Builder or Enterprise — your call.</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 32 }}>Solo agency or team: Builder at $99/mo. Multi-seat agency: Enterprise at $299/mo.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up" style={{ background: C.accent, color: C.bgDark, padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>Start free trial</Link>
          <Link href="/contact" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>Enterprise inquiry</Link>
        </div>
      </section>

      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '24px clamp(16px,3vw,48px)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.mute }}>© 2026 JD AI Systems, LLC</span>
        <nav style={{ display: 'flex', gap: 20 }}>
          {[['Founders', '/solutions/founders'], ['Creators', '/solutions/creators'], ['Plans', '/plans']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: C.mute, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
