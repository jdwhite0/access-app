import Link from 'next/link'

export const metadata = {
  title: 'ACCESS for Founders — Run your entire operation from one place',
  description: 'ACCESS gives founders the operating infrastructure to manage projects, clients, assets, and intelligence — without switching tools.',
}

const C = { bg: '#FFFFFF', bgAlt: '#F7F9FC', bgDark: '#0A2540', text: '#0A2540', sub: '#425466', mute: '#697386', border: '#E6EBF1', accent: '#40C0D0' } as const

export default function FoundersPage() {
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
        <p style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em', color: C.accent, marginBottom: 16, textTransform: 'uppercase' }}>ACCESS for Founders</p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,56px)', fontWeight: 700, color: C.text, lineHeight: 1.1, margin: '0 0 24px' }}>
          You&apos;re the founder, the ops team, and the strategist. ACCESS is your operating system.
        </h1>
        <p style={{ fontSize: 18, color: C.sub, lineHeight: 1.7, margin: '0 0 36px', maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
          Stop running your company across five disconnected tools. ACCESS gives you one connected platform — registry, projects, CRM, assets, workflows, and JYSON — your AI that knows your whole operation.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/sign-up" style={{ background: C.bgDark, color: '#fff', padding: '13px 28px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>Start free — no card required</Link>
          <Link href="/plans" style={{ background: C.bgAlt, color: C.text, padding: '13px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none', border: `1px solid ${C.border}` }}>See Builder plan $99/mo</Link>
        </div>
      </section>

      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: 'clamp(40px,5vw,64px) clamp(16px,3vw,48px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 32, textAlign: 'center' }}>What founders use ACCESS for</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { icon: '◈', title: 'Registry as your brain', body: 'Every system, SOP, vendor, tool, and blueprint lives in your registry. Stop losing context when a project pauses.' },
              { icon: '◎', title: 'JYSON as your operator', body: 'Your AI reads your registry and projects. Ask it what to work on next. It knows your operation because it lives inside it.' },
              { icon: '▤', title: 'CRM without the bloat', body: 'Track leads, clients, and partners without the complexity of Salesforce or the limitations of a spreadsheet.' },
              { icon: '▦', title: 'Workflows that run alone', body: 'Automate the repeatable parts of your operation. Build once, run forever.' },
              { icon: '◇', title: 'Vault for sensitive work', body: 'Contracts, credentials, financial documents — stored encrypted, organized, and accessible when you need them.' },
              { icon: '△', title: 'Offers as a system', body: 'Build products, services, and proposals inside the same platform where you manage delivery.' },
            ].map((f) => (
              <div key={f.title} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                <p style={{ fontSize: 18, marginBottom: 10 }}>{f.icon}</p>
                <p style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>{f.title}</p>
                <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.6, margin: 0 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: C.bgDark, padding: 'clamp(48px,6vw,80px) clamp(16px,3vw,48px)', textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontFamily: 'monospace', color: C.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Pricing for founders</p>
        <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', color: '#fff', fontWeight: 700, marginBottom: 12 }}>Builder plan — $99/month</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
          Unlimited projects, registry, CRM. 1,000 JYSON messages/month. 100GB storage. Workflows. Offers. 14-day free trial.
        </p>
        <Link href="/sign-up" style={{ background: C.accent, color: C.bgDark, padding: '14px 32px', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
          Start your free trial
        </Link>
      </section>

      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '24px clamp(16px,3vw,48px)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.mute }}>© 2026 JD AI Systems, LLC</span>
        <nav style={{ display: 'flex', gap: 20 }}>
          {[['Agencies', '/solutions/agencies'], ['Creators', '/solutions/creators'], ['Plans', '/plans']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: C.mute, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
