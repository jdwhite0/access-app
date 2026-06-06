import { SignIn } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AuthPageShell from '@/components/auth/AuthPageShell'

export const metadata = {
  title: 'Sign in — JYSON by JD AI Systems',
}

export default async function SignInPage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <AuthPageShell>
      <div className="access-auth-root">
        <div className="access-auth-layout">

          {/* ── Left brand panel ── */}
          <div className="access-auth-brand">
            <div className="access-auth-brand__inner">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 56 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #40C0D0, #1a8fa0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontFamily: 'monospace', fontWeight: 700, flexShrink: 0 }}>J</div>
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: '0.14em', color: '#ffffff', display: 'block', lineHeight: 1.2 }}>JYSON</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', display: 'block', marginTop: 2 }}>by JD AI Systems</span>
                </div>
              </div>

              <p className="access-auth-brand__tagline">
                Your AI operator.<br />Your systems.<br />Your edge.
              </p>

              <div className="access-auth-brand__pillars">
                {[
                  { icon: '◎', label: 'Always in context', desc: 'JYSON remembers every project, session, and decision — nothing gets lost.' },
                  { icon: '▤', label: 'One workspace', desc: 'Projects, assets, offers, and systems connected and searchable.' },
                  { icon: '◇', label: 'Built to compound', desc: 'Every session makes the next one faster. Your operator grows with you.' },
                ].map((p) => (
                  <div key={p.label} className="access-auth-brand__pillar">
                    <span className="access-auth-brand__pillar-icon">{p.icon}</span>
                    <div>
                      <p className="access-auth-brand__pillar-label">{p.label}</p>
                      <p className="access-auth-brand__pillar-desc">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right form panel ── */}
          <div className="access-auth-form">
            <div className="access-auth-form__inner">

              {/* Top nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #40C0D0, #1a8fa0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontFamily: 'monospace', fontWeight: 700 }}>J</div>
                  <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: '#0a2540', fontFamily: 'monospace' }}>JYSON</span>
                </div>
                <Link href="/jyson" style={{ fontSize: 13, color: '#8898aa', textDecoration: 'none', fontWeight: 500 }}>← Back</Link>
              </div>

              {/* Header */}
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: '#0a2540', margin: '0 0 10px', lineHeight: 1.15 }}>
                  Sign in to JYSON
                </h1>
                <p style={{ fontSize: 15, color: '#697386', margin: 0, lineHeight: 1.6 }}>
                  Your AI operator is ready when you are.
                </p>
              </div>

              <SignIn
                forceRedirectUrl="/dashboard"
                appearance={{
                  variables: {
                    colorPrimary: '#0a2540',
                    colorBackground: 'transparent',
                    colorText: '#0a2540',
                    colorTextSecondary: '#425466',
                    colorInputBackground: '#f9fafb',
                    colorInputText: '#0a2540',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    fontSize: '15px',
                  },
                  elements: {
                    rootBox: 'access-clerk-root',
                    card: 'access-clerk-card',
                    headerTitle: 'access-clerk-hidden',
                    headerSubtitle: 'access-clerk-hidden',
                    socialButtonsBlockButton: 'access-clerk-social-btn',
                    socialButtonsBlockButtonText: 'access-clerk-social-btn-text',
                    dividerRow: 'access-clerk-divider',
                    dividerText: 'access-clerk-divider-text',
                    formFieldInput: 'access-clerk-input',
                    formFieldLabel: 'access-clerk-label',
                    formButtonPrimary: 'access-clerk-primary-btn',
                    footerActionLink: 'access-clerk-footer-link',
                    identityPreviewText: 'access-clerk-identity-text',
                    alertText: 'access-clerk-alert-text',
                    formResendCodeLink: 'access-clerk-resend-link',
                  },
                }}
              />

              <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid #f0f4f8', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#697386', margin: '0 0 16px' }}>
                  New to JYSON?{' '}
                  <Link href="/sign-up" style={{ color: '#0a2540', fontWeight: 600, textDecoration: 'none' }}>
                    Create a free account
                  </Link>
                </p>
                <p style={{ fontSize: 11, color: '#c4cdd8', margin: 0, lineHeight: 1.6 }}>
                  <Link href="/terms" style={{ color: '#c4cdd8', textDecoration: 'underline' }}>Terms</Link>
                  {' · '}
                  <Link href="/privacy" style={{ color: '#c4cdd8', textDecoration: 'underline' }}>Privacy</Link>
                  {' · '}Powered by JD AI Systems
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </AuthPageShell>
  )
}
