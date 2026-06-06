import Link from 'next/link'

export const metadata = {
  title: 'Changelog — ACCESS',
  description: 'Latest updates, new features, and improvements to the ACCESS platform.',
}

const C = { bg: '#FFFFFF', bgAlt: '#F7F9FC', bgDark: '#0A2540', text: '#0A2540', sub: '#425466', mute: '#697386', border: '#E6EBF1', accent: '#40C0D0', green: '#2D8A6E', yellow: '#D4A017' } as const

const RELEASES = [
  {
    date: 'June 6, 2026',
    version: '2.4',
    badge: 'New',
    badgeColor: C.green,
    title: 'Pricing redesign + Florida/Georgia legal compliance',
    items: [
      'New three-tier pricing: Personal ($29), Builder ($99), Enterprise ($299)',
      '14-day free trial on Builder — no credit card required',
      'ACH bank transfer support via Stripe (0.8% vs 2.9% card fees)',
      'Full privacy policy rewrite: FDBR, FIPA, FDUTPA, Georgia GFBPA compliance',
      'Terms of Service rewrite with auto-renewal disclosure, ACH authorization language',
      'Privacy Request panel in Account settings (FDBR data access, portability, correction)',
      'HTTP security headers: HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy',
      '18+ age confirmation gate on signup (COPPA)',
      'New /compare page with competitor analysis vs Notion, ClickUp, HubSpot, ChatGPT',
      'New /about, /security, /changelog, /help, /acceptable-use, /cookies pages',
    ],
  },
  {
    date: 'June 3, 2026',
    version: '2.3',
    badge: 'Major',
    badgeColor: C.accent,
    title: 'Full platform build — all pages live',
    items: [
      'Registry, Projects, Customers (CRM), Assets, Vaults, Workflows, Offers, Memory — all production-ready',
      'JYSON AI layer with workspace context and session memory',
      'Billing system wired: Stripe checkout + customer portal',
      'Founder account: jdwhite.access — lifetime free, full access',
      'Admin dashboard with user management, MRR tracking, system status',
      'Settings: Profile, Account, Billing, Notifications, Intelligence',
      'Email system: transactional emails, daily briefs, weekly digests',
    ],
  },
  {
    date: 'June 2, 2026',
    version: '2.2',
    badge: 'Update',
    badgeColor: C.yellow,
    title: 'M5 Command Center architecture + OpenJarvis integration',
    items: [
      'Native OpenJarvis adapter connected',
      'Orbital orb UI for JYSON companion interface',
      'Vault registration schema, actions, and UI built',
      'Terminal guided vault flow scaffolded',
      'Path normalization across vault/local bridge',
    ],
  },
  {
    date: 'May 30, 2026',
    version: '2.1',
    badge: 'Update',
    badgeColor: C.yellow,
    title: 'Authentication, identity, and onboarding overhaul',
    items: [
      'Clerk authentication fully integrated with ACCESS handle system',
      'Onboarding flow: handle claim, plan selection, workspace setup',
      'Marketing consent captured at signup (opt-in only)',
      'Email preferences page and unsubscribe system wired',
      'ACCESS ID system: username.access identity layer',
    ],
  },
  {
    date: 'May 20, 2026',
    version: '2.0',
    badge: 'Launch',
    badgeColor: C.bgDark,
    title: 'ACCESS platform v2 — initial build',
    items: [
      'Next.js 15 app router with TypeScript',
      'Supabase database + Row Level Security',
      'Design system: Stripe-inspired white-first aesthetic',
      'Plans page with three-tier architecture',
      'Checkout flow via Stripe embedded checkout',
      'JYSON brand introduced — AI intelligence layer',
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      <header style={{ borderBottom: `1px solid ${C.border}`, padding: '0 clamp(16px,3vw,48px)', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
        <Link href="/" style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textDecoration: 'none' }}>ACCESS</Link>
        <nav style={{ display: 'flex', gap: 24, marginLeft: 'auto' }}>
          {[['About', '/about'], ['Plans', '/plans'], ['Status', '/status']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 14, color: C.sub, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </header>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px,8vw,96px) clamp(16px,3vw,48px) clamp(32px,4vw,56px)' }}>
        <p style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em', color: C.accent, marginBottom: 16, textTransform: 'uppercase' }}>Changelog</p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: C.text, lineHeight: 1.1, margin: '0 0 16px' }}>Platform updates</h1>
        <p style={{ fontSize: 17, color: C.sub, lineHeight: 1.7, margin: 0 }}>Everything new, improved, and shipped on ACCESS. Updated with every release.</p>
      </section>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: '0 clamp(16px,3vw,48px) clamp(64px,8vw,120px)' }}>
        {RELEASES.map((r, i) => (
          <div key={r.version} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 32, marginBottom: 56, paddingBottom: 56, borderBottom: i < RELEASES.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <div>
              <p style={{ fontSize: 12, color: C.mute, fontFamily: 'monospace', marginBottom: 8 }}>{r.date}</p>
              <span style={{ display: 'inline-block', background: r.badgeColor, color: r.badgeColor === C.bgDark ? '#fff' : '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{r.badge}</span>
              <p style={{ fontSize: 12, color: C.mute, fontFamily: 'monospace', marginTop: 8 }}>v{r.version}</p>
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>{r.title}</h2>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {r.items.map((item) => (
                  <li key={item} style={{ fontSize: 14, color: C.sub, lineHeight: 1.6, paddingLeft: 16, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: C.accent }}>·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '24px clamp(16px,3vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.mute }}>© 2026 JD AI Systems, LLC</span>
        <nav style={{ display: 'flex', gap: 20 }}>
          {[['Status', '/status'], ['Terms', '/terms'], ['Privacy', '/privacy']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: C.mute, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
