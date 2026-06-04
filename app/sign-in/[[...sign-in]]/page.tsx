import { SignIn } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = {
  title: 'Sign in — ACCESS',
}

export default async function SignInPage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <div className="access-auth-root">
      <div className="access-auth-layout">
        {/* Left brand panel — desktop only */}
        <div className="access-auth-brand">
          <div className="access-auth-brand__inner">
            <Link href="/" className="access-auth-brand__wordmark">ACCESS</Link>
            <p className="access-auth-brand__tagline">
              The operating system for founders who compound.
            </p>
            <div className="access-auth-brand__pillars">
              {[
                { icon: '▤', label: 'Registry', desc: 'Every system, asset, and project in one place' },
                { icon: '◎', label: 'JYSON',    desc: 'AI that knows your context and compounds with you' },
                { icon: '◇', label: 'Workflows', desc: 'Automation that runs when you\'re not watching' },
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
            {/* Mobile wordmark */}
            <Link href="/" className="access-auth-form__wordmark-mobile">ACCESS</Link>

            <div className="access-auth-form__header">
              <h1 className="access-auth-form__title">Welcome back</h1>
              <p className="access-auth-form__subtitle">Sign in to your ACCESS workspace</p>
            </div>

            <SignIn
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
              Don&apos;t have an account?{' '}
              <Link href="/sign-up" className="access-auth-form__footer-link">Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
