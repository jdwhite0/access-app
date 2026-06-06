import Link from 'next/link'
export const metadata = { title: 'ACCESS for Consultants', description: 'ACCESS gives consultants a structured operating platform for client delivery, knowledge management, and business development.' }
const C = { bg: '#FFFFFF', bgAlt: '#F7F9FC', bgDark: '#0A2540', text: '#0A2540', sub: '#425466', mute: '#697386', border: '#E6EBF1', accent: '#40C0D0' } as const
export default function ConsultantsPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>
      <header style={{ borderBottom: `1px solid ${C.border}`, padding: '0 clamp(16px,3vw,48px)', display: 'flex', alignItems: 'center', height: 64 }}>
        <Link href="/" style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textDecoration: 'none' }}>ACCESS</Link>
        <nav style={{ display: 'flex', gap: 24, marginLeft: 'auto' }}>
          <Link href="/plans" style={{ fontSize: 14, color: C.sub, textDecoration: 'none' }}>Plans</Link>
          <Link href="/sign-up" style={{ fontSize: 14, background: C.bgDark, color: '#fff', padding: '7px 16px', borderRadius: 6, textDecoration: 'none' }}>Get ACCESS</Link>
        </nav>
      </header>
      <section style={{ maxWidth: 800, margin: '0 auto', padding: 'clamp(48px,8vw,96px) clamp(16px,3vw,48px) 48px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em', color: C.accent, marginBottom: 16, textTransform: 'uppercase' }}>ACCESS for Consultants</p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: C.text, lineHeight: 1.1, margin: '0 0 24px' }}>Your expertise is the product. ACCESS is the infrastructure.</h1>
        <p style={{ fontSize: 17, color: C.sub, lineHeight: 1.7, margin: '0 0 36px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>Client registry, proposal builder, project tracker, knowledge vault, and JYSON intelligence — everything a consultant needs to scale impact without scaling overhead.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up" style={{ background: C.bgDark, color: '#fff', padding: '13px 28px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>Start free trial</Link>
          <Link href="/compare" style={{ background: C.bgAlt, color: C.text, padding: '13px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: `1px solid ${C.border}` }}>Compare plans</Link>
        </div>
      </section>
      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: 'clamp(40px,5vw,64px) clamp(16px,3vw,48px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {[
            { title: 'IP and methodology vault', body: 'Store your frameworks, templates, and proprietary methodologies in a searchable, encrypted vault.' },
            { title: 'Client engagement CRM', body: 'Every client, engagement, decision, and next step tracked in one structured record.' },
            { title: 'Proposals and offers', body: 'Build retainer packages, project proposals, and advisory offers inside ACCESS.' },
            { title: 'Billable project tracking', body: 'Projects with milestones, deliverables, and client-facing context built in.' },
            { title: 'JYSON as thought partner', body: 'Use JYSON to pressure-test recommendations, prepare client presentations, and synthesize research.' },
            { title: 'Workflow automation', body: 'Automate client onboarding, weekly status updates, and recurring deliverable prep.' },
          ].map((f) => (
            <div key={f.title} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <p style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>{f.title}</p>
              <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.6, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ background: C.bgDark, padding: 'clamp(48px,6vw,80px) clamp(16px,3vw,48px)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, color: '#fff', fontWeight: 700, marginBottom: 12 }}>Builder at $99/month</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginBottom: 32 }}>Unlimited projects, clients, JYSON access, and workflows. 14-day free trial.</p>
        <Link href="/sign-up" style={{ background: C.accent, color: C.bgDark, padding: '14px 32px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>Start your free trial</Link>
      </section>
      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '24px clamp(16px,3vw,48px)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.mute }}>© 2026 JD AI Systems, LLC</span>
        <nav style={{ display: 'flex', gap: 20 }}>
          {[['Agencies', '/solutions/agencies'], ['Nonprofits', '/solutions/nonprofits'], ['Plans', '/plans']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: C.mute, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
