'use client'

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'

type TerminalLandingProps = {
  /** When set (e.g. from ?redirect=founder), sign-in returns to that destination. */
  onSignIn?: () => void
}

export default function TerminalLanding({ onSignIn }: TerminalLandingProps) {
  const { redirectToSignIn } = useClerk()
  const [demoMode, setDemoMode] = useState(false)

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn()
      return
    }
    redirectToSignIn({ redirectUrl: window.location.href })
  }

  if (demoMode) return <DemoTerminal onExit={() => setDemoMode(false)} onSignIn={handleSignIn} />

  return (
    <div className="access-landing">
      {/* Brand eyebrow */}
      <div className="brand-eyebrow">JD AI SYSTEMS</div>

      {/* Hero wordmark */}
      <div className="brand-hero">
        <div className="brand-hero-text">ACCESS</div>
        <div className="brand-hero-glow" />
      </div>

      {/* Primary headline */}
      <div className="hero-tagline">
        Create your ACCESS identity.
      </div>

      {/* Supporting copy */}
      <div className="hero-sub">
        Register your presence.&nbsp;&nbsp;
        Own your systems.&nbsp;&nbsp;
        Connect intelligence.
      </div>

      {/* Auth */}
      <div className="auth-stack">
        <button className="auth-primary-btn" onClick={handleSignIn}>
          <span className="auth-primary-icon">◈</span>
          Get Access
        </button>

        <div className="auth-divider">
          <span>continue with</span>
        </div>

        <div className="auth-providers">
          <button className="auth-provider-btn" onClick={handleSignIn}>
            <GoogleIcon />
            Google
          </button>
          <button className="auth-provider-btn" onClick={handleSignIn}>
            <GitHubIcon />
            GitHub
          </button>
          <button className="auth-provider-btn" onClick={handleSignIn}>
            <AppleIcon />
            Apple
          </button>
        </div>
      </div>

      {/* Identity model — the key distinction */}
      <div className="identity-model">
        <div className="identity-model-row">
          <span className="identity-model-label">Your login</span>
          <span className="identity-model-sep">→</span>
          <span className="identity-model-value">verifies you</span>
        </div>
        <div className="identity-model-row">
          <span className="identity-model-label">Your ACCESS ID</span>
          <span className="identity-model-sep">→</span>
          <span className="identity-model-value accent">identifies you</span>
        </div>
        <p className="identity-model-note">
          Authentication can change. Identity remains.
        </p>
      </div>

      {/* Ecosystem copy */}
      <p className="app-position-text">
        ACCESS is part of JD AI Systems — the infrastructure ecosystem
        for building, registering, and connecting intelligent systems.
      </p>

      {/* Ecosystem product line */}
      <div className="ecosystem-line">
        <span className="eco-product active">ACCESS</span>
        <span className="eco-divider">·</span>
        <span className="eco-product">JYSON</span>
        <span className="eco-divider">·</span>
        <span className="eco-product">Builder</span>
        <span className="eco-divider">·</span>
        <span className="eco-product">Vault</span>
      </div>

      {/* Demo link */}
      <button className="demo-link" onClick={() => setDemoMode(true)}>
        → Explore the terminal first
      </button>
    </div>
  )
}

/* ─── Demo Terminal ─────────────────────────────────── */
function DemoTerminal({ onExit, onSignIn }: { onExit: () => void; onSignIn: () => void }) {
  return (
    <div className="demo-wrap">
      <div className="demo-inner">
        <div className="demo-topbar">
          <button className="demo-back-btn" onClick={onExit}>← back</button>
          <span className="demo-tag">DEMO — READ ONLY</span>
        </div>

        <div className="demo-line">
          <span className="demo-key">SYSTEM</span>
          <span style={{ color: 'var(--accent)' }}>ACCESS — identity and registry layer</span>
        </div>
        <div className="demo-line">
          <span className="demo-key">PURPOSE</span>
          <span style={{ color: 'var(--text-dim)' }}>Create identity. Register systems. Own what you build.</span>
        </div>
        <div className="demo-line" style={{ marginTop: '16px' }}>
          <span className="demo-key">PART OF</span>
          <span style={{ color: 'var(--text-muted)' }}>JD AI Systems  ·  JYSON  ·  Builder  ·  Vault</span>
        </div>
        <div className="demo-line" style={{ marginTop: '8px' }}>
          <span className="demo-key">CMDS</span>
          <span style={{ color: 'var(--text-muted)' }}>/my-id  /my-systems  /register-system  /help</span>
        </div>

        <div style={{
          marginTop: '20px', padding: '12px 14px',
          border: '1px solid rgba(64,192,208,0.12)',
          background: 'rgba(64,192,208,0.02)',
          borderRadius: '2px',
          fontFamily: 'var(--mono)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          lineHeight: '1.7',
        }}>
          Sign in to claim your <span style={{ color: 'var(--accent)' }}>username.access</span> identity
          and register your first system.
        </div>

        <button className="auth-primary-btn small" style={{ marginTop: '20px' }} onClick={onSignIn}>
          Claim your ACCESS ID
        </button>
      </div>
    </div>
  )
}

/* ─── Icons ─────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  )
}
