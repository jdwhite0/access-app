import Link from 'next/link'

export const metadata = {
  title: 'Security — ACCESS',
  description: 'How JD AI Systems protects your data, credentials, and workspace on the ACCESS platform.',
}

const C = { bg: '#FFFFFF', bgAlt: '#F7F9FC', bgDark: '#0A2540', text: '#0A2540', sub: '#425466', mute: '#697386', border: '#E6EBF1', accent: '#40C0D0', green: '#2D8A6E' } as const

export default function SecurityPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      <header style={{ borderBottom: `1px solid ${C.border}`, padding: '0 clamp(16px,3vw,48px)', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
        <Link href="/" style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textDecoration: 'none' }}>ACCESS</Link>
        <nav style={{ display: 'flex', gap: 24, marginLeft: 'auto' }}>
          {[['About', '/about'], ['Plans', '/plans'], ['Contact', '/contact']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 14, color: C.sub, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </header>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px,8vw,96px) clamp(16px,3vw,48px) clamp(32px,5vw,64px)' }}>
        <p style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em', color: C.green, marginBottom: 16, textTransform: 'uppercase' }}>Security</p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: C.text, lineHeight: 1.1, margin: '0 0 24px' }}>
          Your data is protected at every layer.
        </h1>
        <p style={{ fontSize: 18, color: C.sub, lineHeight: 1.7, margin: 0 }}>
          ACCESS is built on infrastructure that meets enterprise-grade security standards. Here&apos;s exactly what protects your workspace.
        </p>
      </section>

      {/* Trust badges */}
      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: 'clamp(24px,3vw,40px) clamp(16px,3vw,48px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
          {[
            { label: 'TLS 1.2+', desc: 'All traffic encrypted in transit' },
            { label: 'AES-256', desc: 'Data encrypted at rest' },
            { label: 'PCI-DSS', desc: 'Payment data via Stripe' },
            { label: 'SOC 2', desc: 'Auth via Clerk (SOC 2 Type II)' },
            { label: 'HTTPS Only', desc: 'HSTS enforced via Vercel' },
            { label: 'NACHA', desc: 'ACH governed by federal rules' },
          ].map((b) => (
            <div key={b.label} style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: C.green, marginBottom: 4 }}>{b.label}</p>
              <p style={{ fontSize: 12, color: C.mute, margin: 0 }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Detail sections */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px,6vw,80px) clamp(16px,3vw,48px)' }}>
        {[
          {
            title: 'Infrastructure security',
            items: [
              'All platform traffic encrypted with TLS 1.2+ via Vercel Edge Network',
              'Strict-Transport-Security (HSTS) enforced with max-age 63,072,000 seconds',
              'HTTP security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy',
              'Data stored in Supabase with AES-256 encryption at rest',
              'Database connections use SSL-enforced certificates',
              'Vercel Edge Functions run in isolated execution environments',
            ],
          },
          {
            title: 'Authentication and identity',
            items: [
              'Authentication powered by Clerk (SOC 2 Type II certified)',
              'Support for multi-factor authentication (MFA) via TOTP and SMS',
              'Session tokens are short-lived and rotated on sensitive operations',
              'OAuth 2.0 flows for social sign-in (Google) with PKCE protection',
              'Passwords are hashed using bcrypt with a minimum cost factor of 12',
              'Account lockout after repeated failed authentication attempts',
            ],
          },
          {
            title: 'Payment security',
            items: [
              'All payment processing handled by Stripe, Inc. (PCI-DSS Level 1 certified)',
              'We never store full card numbers, CVVs, or bank account numbers',
              'Only Stripe Customer IDs and payment method references are stored',
              'ACH transactions governed by NACHA Operating Rules',
              'Stripe uses TLS 1.2+ for all payment API calls',
              '3D Secure authentication available for card payments on high-risk transactions',
            ],
          },
          {
            title: 'Application security',
            items: [
              'Clickjacking protection via X-Frame-Options: SAMEORIGIN header',
              'MIME type sniffing prevented via X-Content-Type-Options: nosniff',
              'All user input sanitized and parameterized to prevent SQL injection',
              'Server Actions use CSRF-safe patterns via Next.js App Router',
              'API routes validate authentication on every request',
              'Admin routes protected by additional role verification',
            ],
          },
          {
            title: 'Data privacy and breach response',
            items: [
              'Data stored in the United States across all providers',
              'No personal data sold to third parties — ever',
              'Florida residents notified within 30 days of a discovered breach (FIPA)',
              'Georgia residents notified without unreasonable delay (O.C.G.A. § 10-1-912)',
              'Data deletion is permanent and irreversible upon account closure (90-day window)',
              'Billing records retained 7 years per tax law; all other data deleted on request',
            ],
          },
        ].map((section) => (
          <div key={section.title} style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>{section.title}</h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {section.items.map((item) => (
                <li key={item} style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, paddingLeft: 20, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: C.green }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Responsible disclosure */}
      <section style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: 'clamp(40px,5vw,64px) clamp(16px,3vw,48px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 12 }}>Responsible disclosure</h2>
          <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.7, marginBottom: 16 }}>
            If you discover a security vulnerability in ACCESS, please report it to us responsibly before public disclosure.
            We take all security reports seriously and will respond within 72 hours.
          </p>
          <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.7 }}>
            Email: <a href="mailto:support@jdwhite.world" style={{ color: C.accent }}>support@jdwhite.world</a> with the subject line &quot;Security Report&quot;.
            Please include a description of the vulnerability, steps to reproduce, and potential impact.
          </p>
        </div>
      </section>

      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '24px clamp(16px,3vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.mute }}>© 2026 JD AI Systems, LLC · Tampa, FL</span>
        <nav style={{ display: 'flex', gap: 20 }}>
          {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Contact', '/contact']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: C.mute, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
