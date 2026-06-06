import { SignIn } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AuthPageShell from '@/components/auth/AuthPageShell'

export const metadata = {
  title: 'Sign in to JYSON — JD AI Systems',
}

export default async function SignInPage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <AuthPageShell>
    <div className="access-auth-root">
      <div className="access-auth-layout">
        {/* Left brand panel — desktop only */}
        <div className="access-auth-brand">
          <div className="access-auth-brand__inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg, #40C0D0, #1a8fa0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontFamily: 'monospace', fontWeight: 700 }}>J</div>
              <div>
                <p className="access-auth-brand__wordmark" style={{ fontFamily: 'monospace', fontSize: 16, letterSpacing: '0.14em' }}>JYSON</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0, letterSpacing: '0.04em' }}>by JD AI Systems</p>
              </div>
            </div>
            <p className="access-auth-brand__tagline">
              Your AI operator. Your workspace. Your systems.
            </p>
            <div className="access-auth-brand__pillars">
              {[
                { icon: '◎', label: 'Intelligence', desc: 'AI that knows your context and compounds with every session' },
                { icon: '▤', label: 'Projects', desc: 'Track everything you\'re building in one structured place' },
                { icon: '◇', label: 'Systems', desc: 'Automation and workflows that run while you focus elsewhere' },
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

        {/* Right form panel */}
        <div className="access-auth-form">
          <div className="access-auth-form__inner">
            {/* Mobile: JYSON mark + back link */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }} className="access-auth-form__mobile-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #40C0D0, #1a8fa0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontFamily: 'monospace', fontWeight: 700 }}>J</div>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', color: '#0a2540', fontFamily: 'monospace' }}>JYSON</span>
              </div>
              <Link href="/jyson" style={{ fontSize: 13, color: '#697386', textDecoration: 'none' }}>← Back</Link>
            </div>

            <div className="access-auth-form__header">
              <h1 className="access-auth-form__title">Sign in to JYSON</h1>
              <p className="access-auth-form__subtitle">Your AI operator is ready. Sign in to continue.</p>
            </div>

            <SignIn
              forceRedirectUrl="/dashboard"
              appearance={{
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
                  identityPreviewEditButtonIcon: 'access-clerk-identity-edit',
                  alertText: 'access-clerk-alert-text',
                  formResendCodeLink: 'access-clerk-resend-link',
                },
                variables: {
                  colorPrimary: '#0a2540',
                  colorBackground: '#ffffff',
                  colorText: '#0a2540',
                  colorTextSecondary: '#425466',
                  colorInputBackground: '#ffffff',
                  colorInputText: '#0a2540',
                  borderRadius: '6px',
                  fontFamily: 'inherit',
                  fontSize: '15px',
                },
              }}
            />

            <p className="access-auth-form__footer">
              New to JYSON?{' '}
              <Link href="/sign-up" className="access-auth-form__footer-link">Create account free</Link>
            </p>

            <p style={{ fontSize: 11, color: '#697386', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
              By continuing, you agree to{' '}
              <Link href="/" style={{ color: '#697386', textDecoration: 'underline' }}>Terms</Link>
              {' '}and{' '}
              <Link href="/" style={{ color: '#697386', textDecoration: 'underline' }}>Privacy Policy</Link>
              {' '}— Powered by JD AI Systems
            </p>
          </div>
        </div>
      </div>
    </div>
    </AuthPageShell>
  )
}
