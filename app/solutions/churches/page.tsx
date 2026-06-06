import Link from 'next/link'
export const metadata = { title: 'ACCESS for Churches and Faith Organizations', description: 'ACCESS helps churches and faith organizations manage ministries, members, volunteers, and operations from one connected platform.' }
const C = { bg: '#FFFFFF', bgAlt: '#F7F9FC', bgDark: '#0A2540', text: '#0A2540', sub: '#425466', mute: '#697386', border: '#E6EBF1', accent: '#40C0D0' } as const
export default function ChurchesPage() {
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
        <p style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em', color: C.accent, marginBottom: 16, textTransform: 'uppercase' }}>ACCESS for Churches</p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: C.text, lineHeight: 1.1, margin: '0 0 24px' }}>Build the church. Not the chaos.</h1>
        <p style={{ fontSize: 17, color: C.sub, lineHeight: 1.7, margin: '0 0 36px', maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
          Ministry operations are complex. People, programs, facilities, finances, volunteers, and community — ACCESS gives faith organizations the infrastructure to run it all with clarity and purpose.
        </p>
        <Link href="/sign-up" style={{ background: C.bgDark, color: '#fff', padding: '14px 32px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>Start at $29/month</Link>
      </section>
      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: 'clamp(40px,5vw,64px) clamp(16px,3vw,48px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {[
            { title: 'Ministry registry', body: 'Document every ministry, team, program, and initiative. Build on what you\'ve already built.' },
            { title: 'Member and volunteer CRM', body: 'Know your congregation. Track relationships, needs, service history, and follow-ups.' },
            { title: 'Event and program projects', body: 'Manage services, events, outreach programs, and capital campaigns like real projects.' },
            { title: 'Sermon and resource vault', body: 'Store sermons, teaching materials, curriculum, and creative assets in an organized, searchable vault.' },
            { title: 'JYSON for ministry teams', body: 'Use AI to draft communications, summarize meeting notes, and plan next steps for each ministry.' },
            { title: 'Faith org pricing', body: 'Access is affordable for churches of every size. Nonprofit discount available — contact us.' },
          ].map((f) => (
            <div key={f.title} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <p style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>{f.title}</p>
              <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.6, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ background: C.bgDark, padding: 'clamp(48px,6vw,80px) clamp(16px,3vw,48px)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 28, color: '#fff', fontWeight: 700, marginBottom: 16 }}>Faith org discount available.</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginBottom: 32 }}>Reach out with your organization details. We built ACCESS to empower builders of every kind.</p>
        <Link href="/contact" style={{ background: C.accent, color: C.bgDark, padding: '14px 32px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>Contact us</Link>
      </section>
      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '24px clamp(16px,3vw,48px)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.mute }}>© 2026 JD AI Systems, LLC</span>
        <nav style={{ display: 'flex', gap: 20 }}>
          {[['Nonprofits', '/solutions/nonprofits'], ['Plans', '/plans'], ['Contact', '/contact']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: C.mute, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
