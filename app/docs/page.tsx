import Link from 'next/link'

export const metadata = {
  title: 'Documentation — ACCESS',
  description: 'Guides, API reference, and platform documentation for ACCESS.',
}

const C = { bg: '#FFFFFF', bgAlt: '#F7F9FC', bgDark: '#0A2540', text: '#0A2540', sub: '#425466', mute: '#697386', border: '#E6EBF1', accent: '#40C0D0' } as const

const DOCS = [
  {
    section: 'Getting started',
    items: [
      { title: 'Create your ACCESS account', desc: 'Sign up, claim your ACCESS handle, and set up your workspace in 5 minutes.', href: '/sign-up' },
      { title: 'Understand your ACCESS ID', desc: 'Your username.access handle is your identity across the entire platform.', href: '/help#access-handle' },
      { title: 'Choosing the right plan', desc: 'Personal, Builder, and Enterprise — which one is right for you?', href: '/compare' },
      { title: 'Onboarding walkthrough', desc: 'What happens after you sign up, step by step.', href: '/onboarding' },
    ],
  },
  {
    section: 'Platform modules',
    items: [
      { title: 'Registry', desc: 'Create and manage objects — systems, blueprints, assets, and more.', href: '/registry' },
      { title: 'Projects', desc: 'End-to-end project management with full workspace context.', href: '/projects' },
      { title: 'Customers (CRM)', desc: 'Manage contacts, pipelines, and client relationships.', href: '/customers' },
      { title: 'Assets', desc: 'Upload, organize, and reference files, media, and documents.', href: '/assets' },
      { title: 'Vaults', desc: 'Encrypted storage for sensitive data, credentials, and knowledge.', href: '/vaults' },
      { title: 'Workflows', desc: 'Build automated sequences that run across your platform.', href: '/workflows' },
      { title: 'Offers', desc: 'Create and manage your products, services, and proposals.', href: '/offers' },
      { title: 'Memory', desc: 'Long-term workspace memory that JYSON reads across sessions.', href: '/memory' },
    ],
  },
  {
    section: 'JYSON — AI intelligence',
    items: [
      { title: 'What is JYSON?', desc: 'JYSON is your AI operator — not a chatbot. It knows your workspace context.', href: '/jyson' },
      { title: 'JYSON message limits', desc: 'How message counts work per plan and when they reset.', href: '/help#jyson-limits' },
      { title: 'JYSON memory system', desc: 'How persistent memory works and how JYSON compounds across sessions.', href: '/memory' },
      { title: 'JYSON and your data', desc: 'What data JYSON can access and how it processes workspace context.', href: '/privacy#jyson' },
    ],
  },
  {
    section: 'Billing and subscriptions',
    items: [
      { title: 'Billing overview', desc: 'Plans, pricing, and payment methods including ACH.', href: '/plans' },
      { title: 'Managing your subscription', desc: 'Upgrade, downgrade, cancel, and update payment method.', href: '/settings/billing' },
      { title: 'ACH bank transfer guide', desc: 'How to set up ACH payment for lower processing fees.', href: '/help#ach-payment' },
      { title: 'Refund policy', desc: '30 days annual, 7 days monthly. How to request a refund.', href: '/terms#refund' },
    ],
  },
  {
    section: 'Account and security',
    items: [
      { title: 'Account settings', desc: 'Manage your profile, handle, and account preferences.', href: '/settings/account' },
      { title: 'Security overview', desc: 'Encryption, authentication, and how your data is protected.', href: '/security' },
      { title: 'Privacy request (FDBR)', desc: 'How to request access, export, correction, or deletion of your data.', href: '/settings/account' },
      { title: 'Delete your account', desc: 'How to permanently close your ACCESS account.', href: '/settings/account' },
    ],
  },
]

export default function DocsPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      <header style={{ borderBottom: `1px solid ${C.border}`, padding: '0 clamp(16px,3vw,48px)', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
        <Link href="/" style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textDecoration: 'none' }}>ACCESS</Link>
        <nav style={{ display: 'flex', gap: 24, marginLeft: 'auto' }}>
          {[['Help', '/help'], ['Status', '/status'], ['Sign in', '/sign-in']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 14, color: C.sub, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </header>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px,8vw,96px) clamp(16px,3vw,48px) clamp(32px,4vw,48px)' }}>
        <p style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em', color: C.accent, marginBottom: 16, textTransform: 'uppercase' }}>Documentation</p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 700, color: C.text, lineHeight: 1.1, margin: '0 0 16px' }}>ACCESS Documentation</h1>
        <p style={{ fontSize: 17, color: C.sub, lineHeight: 1.7, margin: 0 }}>
          Guides for every module, integration, and feature on the ACCESS platform.
          Can&apos;t find what you need?{' '}
          <a href="mailto:support@jdwhite.world" style={{ color: C.accent }}>Contact support.</a>
        </p>
      </section>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(16px,3vw,48px) clamp(64px,8vw,100px)' }}>
        {DOCS.map((section) => (
          <div key={section.section} style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: C.mute, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, fontFamily: 'monospace', paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
              {section.section}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {section.items.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  style={{ display: 'block', border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', textDecoration: 'none', transition: 'border-color 0.15s' }}
                >
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.title} →</p>
                  <p style={{ fontSize: 13, color: C.mute, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* API callout */}
        <div style={{ background: C.bgDark, borderRadius: 16, padding: 'clamp(28px,3vw,40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: C.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>API Access</p>
            <h3 style={{ fontSize: 20, color: '#fff', fontWeight: 700, marginBottom: 8 }}>ACCESS API — Builder & Enterprise</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              Programmatic access to your registry, projects, CRM, and JYSON. Available on Builder and Enterprise plans.
            </p>
          </div>
          <Link href="/contact" style={{ background: C.accent, color: C.bgDark, padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
            Request API access
          </Link>
        </div>
      </section>

      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '24px clamp(16px,3vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.mute }}>© 2026 JD AI Systems, LLC</span>
        <nav style={{ display: 'flex', gap: 20 }}>
          {[['Help', '/help'], ['Terms', '/terms'], ['Privacy', '/privacy']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: C.mute, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
