import { SignUp } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = {
  title: 'Create account — ACCESS',
}

export default async function SignUpPage() {
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
              Your ACCESS ID is the foundation of everything you build.
            </p>
            <div className="access-auth-brand__pillars">
              {[
                { icon: '◈', label: 'Free to start',   desc: 'No credit card required. Build immediately.' },
                { icon: '▤', label: 'Your registry',   desc: 'All your systems, projects, and assets in one place' },
                { icon: '◎', label: 'JYSON included',  desc: 'AI intelligence that compounds with every session' },
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
              <h1 className="access-auth-form__title">Create your ACCESS ID</h1>
              <p className="access-auth-form__subtitle">Free forever. No credit card required.</p>
            </div>

            <SignUp
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
              Already have an account?{' '}
              <Link href="/sign-in" className="access-auth-form__footer-link">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
