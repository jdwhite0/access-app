'use client'

import { useEffect, useState } from 'react'
import { useClerk } from '@clerk/nextjs'

const LINES = [
  { text: 'ACCESS', type: 'title', delay: 200 },
  { text: '─'.repeat(52), type: 'divider', delay: 600 },
  { text: 'The operating layer for builders, creators,', type: 'dim', delay: 900 },
  { text: 'founders, and future intelligence systems.', type: 'dim', delay: 1100 },
  { text: '', type: 'spacer', delay: 1300 },
  { text: 'Gain access to systems, blueprints, intelligence,', type: 'muted', delay: 1500 },
  { text: 'and future capabilities.', type: 'muted', delay: 1700 },
  { text: '', type: 'spacer', delay: 1900 },
  { text: '─'.repeat(52), type: 'divider', delay: 2100 },
] as const

export default function TerminalLanding() {
  const [visibleLines, setVisibleLines] = useState(0)
  const [showPrompt, setShowPrompt] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const { redirectToSignIn } = useClerk()

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), LINES[i].delay))
    })
    timers.push(setTimeout(() => setShowPrompt(true), 2400))
    timers.push(setTimeout(() => setShowAuth(true), 3000))
    return () => timers.forEach(clearTimeout)
  }, [])

  // Use Clerk's hosted sign-in page — the cleanest approach for OAuth
  const handleSignIn = () => {
    redirectToSignIn({ redirectUrl: window.location.href })
  }

  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="w-full max-w-xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 mb-1 opacity-35">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,90,90,0.7)' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,190,50,0.7)' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(50,200,100,0.7)' }} />
          <span className="ml-3 text-[10px] tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>
            ACCESS — v1.0.0
          </span>
        </div>

        {/* Terminal frame */}
        <div
          className="rounded-sm p-8"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {LINES.slice(0, visibleLines).map((line, i) => (
            <div key={i} className="fade-in">
              {line.type === 'title' && (
                <div className="text-2xl tracking-[0.3em] font-normal mb-3" style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>
                  {line.text}
                </div>
              )}
              {line.type === 'divider' && (
                <div className="text-xs mb-4" style={{ color: 'var(--border)', opacity: 0.9, fontFamily: 'var(--mono)' }}>
                  {line.text}
                </div>
              )}
              {line.type === 'dim' && (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.80rem', lineHeight: '1.7', fontFamily: 'var(--mono)' }}>
                  {line.text}
                </div>
              )}
              {line.type === 'muted' && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', lineHeight: '1.7', fontFamily: 'var(--mono)' }}>
                  {line.text}
                </div>
              )}
              {line.type === 'spacer' && <div className="h-2" />}
            </div>
          ))}

          {/* Prompt */}
          {showPrompt && (
            <div className="fade-in mt-5 mb-6" style={{ fontFamily: 'var(--mono)' }}>
              <span style={{ color: 'var(--accent)', fontSize: '0.84rem' }}>&gt;&nbsp;</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>initialize_access</span>
              <span className="cursor" />
            </div>
          )}

          {/* Auth options */}
          {showAuth && (
            <div className="fade-in space-y-2.5">
              <button className="auth-btn" onClick={handleSignIn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.5, flexShrink: 0 }}>
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <button className="auth-btn" onClick={handleSignIn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.5, flexShrink: 0 }}>
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>Continue with GitHub</span>
              </button>

              <button className="auth-btn" onClick={handleSignIn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.5, flexShrink: 0 }}>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <span>Continue with Apple</span>
              </button>

              <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', lineHeight: 1.7, letterSpacing: '0.04em', fontFamily: 'var(--mono)' }}>
                  Authentication grants access to the operating layer.
                  <br />
                  Your identity is the key. The system waits on the other side.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
