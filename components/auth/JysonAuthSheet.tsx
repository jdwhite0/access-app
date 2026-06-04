'use client'

import { useEffect, useCallback, useState } from 'react'
import Link from 'next/link'

type Props = {
  isOpen: boolean
  onClose: () => void
  /** returnTo path to forward after successful auth */
  returnTo?: string
}

/**
 * JYSON Auth Bottom Sheet — ChatGPT/Google One Tap style.
 * Mobile: slides up from bottom. Desktop: centered modal.
 * Clerk powers the auth; JYSON owns the visual experience.
 */
export default function JysonAuthSheet({ isOpen, onClose, returnTo }: Props) {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleGoogle = useCallback(() => {
    setGoogleLoading(true)
    const dest = returnTo ? `/sign-in?redirect_url=${encodeURIComponent(returnTo)}` : '/sign-in'
    window.location.href = dest
  }, [returnTo])

  if (!isOpen) return null

  const emailHref = `/sign-in${returnTo ? `?redirect_url=${encodeURIComponent(returnTo)}` : ''}`
  const signUpHref = `/sign-up${returnTo ? `?redirect_url=${encodeURIComponent(returnTo)}` : ''}`

  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose() }}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to JYSON"
        style={{
          position: 'fixed',
          zIndex: 201,
          // Mobile: bottom sheet
          bottom: 0,
          left: 0,
          right: 0,
          background: '#ffffff',
          borderRadius: '20px 20px 0 0',
          padding: 'clamp(24px, 5vw, 36px)',
          paddingBottom: 'max(clamp(24px, 5vw, 36px), env(safe-area-inset-bottom, 24px))',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
      >
        {/* Handle + close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          {/* Pull handle */}
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, borderRadius: 2, background: '#e6ebf1' }} />
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#f6f9fc', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#697386',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* JYSON brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, #40C0D0, #1a8fa0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontFamily: 'monospace', fontWeight: 700, flexShrink: 0 }}>J</div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0a2540', margin: 0, letterSpacing: '0.05em', fontFamily: 'monospace' }}>JYSON</p>
            <p style={{ fontSize: 11, color: '#697386', margin: 0 }}>by JD AI Systems</p>
          </div>
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#0a2540', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Sign in to JYSON with Google
        </h2>
        <p style={{ fontSize: 14, color: '#697386', margin: '0 0 24px', lineHeight: 1.55 }}>
          Create your own AI operator connected to your ACCESS workspace.
        </p>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f0', border: '1px solid rgba(184,90,58,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#b85a3a' }}>
            {error}
          </div>
        )}

        {/* Google CTA */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '14px 20px',
            borderRadius: 10,
            border: '1px solid #e6ebf1',
            background: googleLoading ? '#f6f9fc' : '#ffffff',
            color: '#0a2540',
            fontSize: 15,
            fontWeight: 600,
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            marginBottom: 12,
            boxShadow: '0 1px 4px rgba(10,37,64,0.08)',
            transition: 'background 0.15s, box-shadow 0.15s',
            WebkitTapHighlightColor: 'transparent',
            opacity: 1,
          }}
          onMouseEnter={(e) => { if (!googleLoading) (e.currentTarget as HTMLButtonElement).style.background = '#f6f9fc' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#ffffff' }}
        >
          {/* Google logo SVG */}
          {!googleLoading ? (
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
          ) : (
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #e6ebf1', borderTopColor: '#1a8fa0', animation: 'spin 0.8s linear infinite' }} />
          )}
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {/* Email alternative */}
        <Link href={emailHref} style={{
          display: 'block',
          textAlign: 'center',
          padding: '13px 20px',
          borderRadius: 10,
          border: '1px solid #e6ebf1',
          background: 'transparent',
          color: '#425466',
          fontSize: 14,
          fontWeight: 500,
          textDecoration: 'none',
          marginBottom: 20,
          transition: 'background 0.12s',
        }}>
          Use email instead
        </Link>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#e6ebf1' }} />
          <span style={{ fontSize: 12, color: '#697386' }}>New to JYSON?</span>
          <div style={{ flex: 1, height: 1, background: '#e6ebf1' }} />
        </div>

        {/* Sign up */}
        <Link href={signUpHref} style={{
          display: 'block',
          textAlign: 'center',
          padding: '13px 20px',
          borderRadius: 10,
          background: '#0a2540',
          color: '#ffffff',
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
          marginBottom: 20,
        }}>
          Create account free →
        </Link>

        {/* Legal */}
        <p style={{ fontSize: 11, color: '#697386', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
          By continuing, you agree to JD AI Systems{' '}
          <Link href="/" style={{ color: '#697386', textDecoration: 'underline' }}>Terms</Link>
          {' '}and{' '}
          <Link href="/" style={{ color: '#697386', textDecoration: 'underline' }}>Privacy Policy</Link>.
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }

        @media (min-width: 640px) {
          [role="dialog"][aria-label="Sign in to JYSON"] {
            bottom: auto !important;
            top: 50% !important;
            left: 50% !important;
            right: auto !important;
            transform: translate(-50%, -50%) !important;
            width: 400px !important;
            max-width: 92vw !important;
            border-radius: 16px !important;
            animation: none !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2) !important;
          }
        }
      `}</style>
    </>
  )
}
