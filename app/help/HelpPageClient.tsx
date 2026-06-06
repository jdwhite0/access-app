'use client'

import { useState } from 'react'
import Link from 'next/link'

const C = { bg: '#FFFFFF', bgAlt: '#F7F9FC', bgDark: '#0A2540', text: '#0A2540', sub: '#425466', mute: '#697386', border: '#E6EBF1', accent: '#40C0D0' } as const

const SECTIONS = [
  {
    category: 'Getting started',
    items: [
      {
        q: 'What is ACCESS?',
        a: 'ACCESS is an AI-powered operating system for founders, creators, agencies, consultants, nonprofits, and operators. It combines a project manager, CRM, asset library, workflow engine, vault, and JYSON — your personal AI intelligence layer — into one connected platform.',
      },
      {
        q: 'How do I create an account?',
        a: 'Click "Get ACCESS" or go to /sign-up. Enter your email and create a password (or sign in with Google). After verifying your email, you\'ll be taken to onboarding where you claim your ACCESS ID (e.g., yourname.access).',
      },
      {
        q: 'Do I need a credit card to start?',
        a: 'No. The free tier is free forever — no credit card required. The Builder plan offers a 14-day free trial, also no card required. You only need billing info when you subscribe to a paid plan.',
      },
      {
        q: 'What is my ACCESS handle?',
        a: 'Your ACCESS handle is your unique identity on the platform — formatted as yourname.access. It\'s how you\'re identified across modules, in JYSON sessions, and in exported reports. You claim it during onboarding.',
      },
    ],
  },
  {
    category: 'Plans and billing',
    items: [
      {
        q: 'What are the ACCESS plans?',
        a: 'Personal ($29/month) — for individuals getting started. Builder ($99/month) — for serious operators who need full features, 1,000 JYSON messages/month, workflows, CRM, and more. Enterprise ($299/month) — for teams with multi-seat access, unlimited everything, and API access. Annual plans save ~17%.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards, debit cards, and ACH bank transfer (US bank accounts). Bank transfer is available on Builder and Enterprise plans. Select your payment method at checkout.',
      },
      {
        q: 'Can I switch plans?',
        a: 'Yes. Upgrades take effect immediately. Downgrades take effect at the end of your current billing period, and your data is preserved in read-only mode during any plan transition.',
      },
      {
        q: 'What is the refund policy?',
        a: 'Annual plans: 30 days from purchase date. Monthly plans: 7 days from first charge. Email support@jdwhite.world to request a refund. We honor refunds for first-period charges; subsequent periods are at our discretion.',
      },
      {
        q: 'How do I cancel?',
        a: 'Go to Settings → Billing → Manage Subscription. You can cancel anytime through the Stripe Customer Portal. Cancellation takes effect at the end of your billing period; you keep access until then.',
      },
    ],
  },
  {
    category: 'JYSON — AI intelligence',
    items: [
      {
        q: 'What is JYSON?',
        a: 'JYSON is the ACCESS intelligence layer — your AI operator. It\'s not a generic chatbot. It reads your registry, projects, CRM, assets, and vault metadata to give you context-aware intelligence that compounds across every session.',
      },
      {
        q: 'How many JYSON messages do I get?',
        a: 'Personal: 100 messages/month. Builder: 1,000 messages/month with persistent memory. Enterprise: unlimited. Message count resets at the start of each billing period.',
      },
      {
        q: 'Does JYSON remember previous conversations?',
        a: 'On Builder and Enterprise, JYSON has persistent session memory that carries context across conversations indefinitely. Personal plan memory is retained for 30 days.',
      },
      {
        q: 'Is my data used to train AI models?',
        a: 'No. Your workspace data is never used to train external AI models. JYSON processes your data only to serve your requests within your workspace.',
      },
    ],
  },
  {
    category: 'Data and privacy',
    items: [
      {
        q: 'Where is my data stored?',
        a: 'All data is stored in the United States. Database infrastructure is powered by Supabase, hosted on AWS US regions. Authentication is via Clerk (US data centers). All data is encrypted at rest and in transit.',
      },
      {
        q: 'Can I export my data?',
        a: 'Yes. Under Settings → Account, you can submit a data portability request. We\'ll export your workspace data in a machine-readable format within 45 days, as required by the Florida Digital Bill of Rights.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings → Account → Danger Zone. Type your ACCESS handle to confirm, then click "Permanently delete account." Your data is removed within 90 days. Billing records are retained 7 years per tax law.',
      },
      {
        q: 'Do you sell my data?',
        a: 'No. We do not sell, rent, or trade your personal data to third parties. Our only data processors are Stripe (payments), Clerk (authentication), Supabase (database), and Vercel (hosting).',
      },
    ],
  },
  {
    category: 'Technical',
    items: [
      {
        q: 'What browsers does ACCESS support?',
        a: 'ACCESS supports all modern browsers: Chrome, Firefox, Safari, and Edge. For the best experience, use Chrome or Edge with JavaScript enabled. Mobile browsers are fully supported.',
      },
      {
        q: 'Is there an API?',
        a: 'The ACCESS API is available on the Builder and Enterprise plans. API documentation is at /docs. Enterprise customers get dedicated API support and higher rate limits.',
      },
      {
        q: 'Is there a mobile app?',
        a: 'ACCESS is a Progressive Web App (PWA) — you can install it on mobile and desktop from your browser. Native iOS and Android apps are on the roadmap.',
      },
      {
        q: 'What is the platform uptime SLA?',
        a: '99.9% uptime for Builder and Enterprise plans. Real-time status is available at /status. We post incident reports and maintenance windows on the status page.',
      },
    ],
  },
]

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', textAlign: 'left', padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{q}</span>
        <span style={{ fontSize: 20, color: C.accent, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s' }}>+</span>
      </button>
      {open && (
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.7, margin: '0 0 18px', paddingRight: 32 }}>{a}</p>
      )}
    </div>
  )
}

export default function HelpPageClient() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      <header style={{ borderBottom: `1px solid ${C.border}`, padding: '0 clamp(16px,3vw,48px)', display: 'flex', alignItems: 'center', height: 64, gap: 32 }}>
        <Link href="/" style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textDecoration: 'none' }}>ACCESS</Link>
        <nav style={{ display: 'flex', gap: 24, marginLeft: 'auto' }}>
          {[['Plans', '/plans'], ['Contact', '/contact'], ['Sign in', '/sign-in']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 14, color: C.sub, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </header>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(48px,8vw,96px) clamp(16px,3vw,48px) clamp(32px,4vw,56px)' }}>
        <p style={{ fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.1em', color: C.accent, marginBottom: 16, textTransform: 'uppercase' }}>Help Center</p>
        <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 700, color: C.text, lineHeight: 1.1, margin: '0 0 16px' }}>Frequently asked questions</h1>
        <p style={{ fontSize: 17, color: C.sub, lineHeight: 1.7, margin: '0 0 32px' }}>
          Can&apos;t find your answer? Email us at{' '}
          <a href="mailto:support@jdwhite.world" style={{ color: C.accent }}>support@jdwhite.world</a>
          {' '}— we respond within one business day.
        </p>
      </section>

      <section style={{ maxWidth: 760, margin: '0 auto', padding: '0 clamp(16px,3vw,48px) clamp(64px,8vw,120px)' }}>
        {SECTIONS.map((s) => (
          <div key={s.category} style={{ marginBottom: 56 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: C.mute, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: 'monospace' }}>{s.category}</h2>
            {s.items.map((item) => <FAQ key={item.q} {...item} />)}
          </div>
        ))}

        <div style={{ background: C.bgDark, borderRadius: 16, padding: 'clamp(28px,3vw,40px)', textAlign: 'center' }}>
          <h3 style={{ fontSize: 20, color: '#fff', fontWeight: 700, marginBottom: 12 }}>Still have questions?</h3>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginBottom: 24 }}>Our team responds within one business day.</p>
          <Link href="/contact" style={{ background: C.accent, color: C.bgDark, padding: '12px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            Contact support
          </Link>
        </div>
      </section>

      <footer style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}`, padding: '24px clamp(16px,3vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.mute }}>© 2026 JD AI Systems, LLC</span>
        <nav style={{ display: 'flex', gap: 20 }}>
          {[['Terms', '/terms'], ['Privacy', '/privacy'], ['Contact', '/contact']].map(([l, h]) => (
            <Link key={l} href={h} style={{ fontSize: 12, color: C.mute, textDecoration: 'none' }}>{l}</Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
