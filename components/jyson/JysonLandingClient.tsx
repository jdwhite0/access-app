'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import JysonAuthSheet from '@/components/auth/JysonAuthSheet'

const CHIPS = [
  'I have expertise',
  'I have an idea',
  'I want recurring revenue',
  'I want to build a system',
  'I have content',
  'I want to scale',
]

type Props = { isSignedIn: boolean }

export default function JysonLandingClient({ isSignedIn }: Props) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  function requireAuth() {
    if (isSignedIn) return true
    setSheetOpen(true)
    return false
  }

  function handleSend() {
    if (!input.trim()) return
    if (!requireAuth()) return
    router.push(`/companion?q=${encodeURIComponent(input)}`)
  }

  function handleChip(chip: string) {
    setInput(chip)
    if (!isSignedIn) setSheetOpen(true)
  }

  return (
    <>
      <JysonAuthSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />

      <div style={{
        minHeight: '100dvh',
        background: '#ffffff',
        color: '#0a2540',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        WebkitFontSmoothing: 'antialiased',
        overflowX: 'hidden',
      }}>
        {/* Header */}
        <header style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 100,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 clamp(16px, 4vw, 40px)',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e6ebf1',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #40C0D0, #1a8fa0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontFamily: 'monospace', fontWeight: 700 }}>J</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: '#0a2540', fontFamily: 'monospace' }}>JYSON</span>
              <span style={{ fontSize: 10, color: '#697386', letterSpacing: '0.04em' }}>by JD AI Systems</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isSignedIn ? (
              <>
                <Link href="/companion" style={{ fontSize: 13, color: '#425466', textDecoration: 'none', padding: '6px 10px' }}>Open JYSON</Link>
                <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none', background: '#0a2540', padding: '7px 16px', borderRadius: 7 }}>Dashboard</Link>
              </>
            ) : (
              <>
                <button onClick={() => setSheetOpen(true)} style={{ fontSize: 13, color: '#425466', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px' }}>Log in</button>
                <button onClick={() => setSheetOpen(true)} style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: '#0a2540', border: 'none', padding: '7px 16px', borderRadius: 7, cursor: 'pointer' }}>Start free</button>
              </>
            )}
          </div>
        </header>

        {/* Main */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'clamp(80px, 14vw, 120px) clamp(16px, 5vw, 40px) 100px',
          maxWidth: 720,
          margin: '0 auto',
          width: '100%',
        }}>
          <h1 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.25, color: '#0a2540', textAlign: 'center', margin: '0 0 8px' }}>
            What are you building today?
          </h1>
          <p style={{ fontSize: 15, color: '#697386', margin: '0 0 32px', textAlign: 'center', lineHeight: 1.5 }}>
            Your AI operator is ready.
          </p>

          {/* Input */}
          <div style={{
            width: '100%',
            background: '#f6f9fc',
            border: '1px solid #e6ebf1',
            borderRadius: 16,
            padding: '4px 4px 4px 16px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            marginBottom: 16,
            boxShadow: '0 1px 4px rgba(10,37,64,0.06)',
          }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              onFocus={() => { if (!isSignedIn) setSheetOpen(true) }}
              placeholder="Ask JYSON anything…"
              rows={3}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#0a2540', fontSize: 15, lineHeight: 1.55, resize: 'none', padding: '12px 0', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 6 }}>
              <button
                onClick={() => requireAuth()}
                style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e6ebf1', background: '#fff', color: '#697386', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
                title="Attach"
              >+</button>
              <button
                onClick={handleSend}
                style={{
                  width: 34, height: 34, borderRadius: 8, border: 'none',
                  background: input.trim() ? '#0a2540' : '#e6ebf1',
                  color: input.trim() ? '#fff' : '#697386',
                  cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700,
                  transition: 'background 0.15s',
                }}
              >↑</button>
            </div>
          </div>

          {/* Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 32, width: '100%' }}>
            {CHIPS.map((chip) => (
              <button key={chip} onClick={() => handleChip(chip)} style={{ fontSize: 13, color: '#425466', background: '#fff', border: '1px solid #e6ebf1', borderRadius: 100, padding: '7px 14px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent', transition: 'border-color 0.12s' }}>
                {chip}
              </button>
            ))}
          </div>

          {/* Advanced features card — unauthenticated */}
          {!isSignedIn && (
            <div style={{
              width: '100%',
              background: '#fff',
              border: '1px solid #e6ebf1',
              borderRadius: 14,
              padding: 'clamp(20px, 4vw, 28px)',
              boxShadow: '0 4px 20px rgba(10,37,64,0.08)',
              marginBottom: 24,
            }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: '#0a2540', margin: '0 0 8px', letterSpacing: '-0.015em' }}>
                Try advanced features for free
              </h2>
              <p style={{ fontSize: 14, color: '#697386', margin: '0 0 20px', lineHeight: 1.55 }}>
                Get smarter responses, connect your workspace, and create your own personalized JYSON by logging in.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSheetOpen(true)}
                  style={{ fontSize: 14, fontWeight: 500, color: '#0a2540', textDecoration: 'none', background: 'transparent', border: '1px solid #c8d6e5', padding: '10px 22px', borderRadius: 8, cursor: 'pointer', minWidth: 100 }}
                >
                  Log in
                </button>
                <button
                  onClick={() => setSheetOpen(true)}
                  style={{ fontSize: 14, fontWeight: 600, color: '#fff', background: '#0a2540', border: 'none', padding: '10px 22px', borderRadius: 8, cursor: 'pointer', minWidth: 140 }}
                >
                  Sign up for free
                </button>
              </div>
            </div>
          )}

          {/* Signed in shortcuts */}
          {isSignedIn && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/companion" style={{ fontSize: 13, color: '#1a8fa0', textDecoration: 'none', border: '1px solid rgba(26,143,160,0.2)', borderRadius: 7, padding: '8px 16px', background: 'rgba(26,143,160,0.04)' }}>
                Open Intelligence →
              </Link>
              <Link href="/dashboard" style={{ fontSize: 13, color: '#425466', textDecoration: 'none', border: '1px solid #e6ebf1', borderRadius: 7, padding: '8px 16px' }}>
                Dashboard
              </Link>
            </div>
          )}
        </main>

        {/* Sticky footer */}
        <footer style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: 'clamp(10px, 2vw, 14px) clamp(16px, 4vw, 40px)',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          borderTop: '1px solid #e6ebf1',
          textAlign: 'center', zIndex: 50,
        }}>
          <p style={{ fontSize: 11, color: '#697386', margin: 0, lineHeight: 1.4 }}>
            By messaging JYSON, you agree to{' '}
            <Link href="/" style={{ color: '#697386', textDecoration: 'underline' }}>Terms</Link>
            {' '}and{' '}
            <Link href="/" style={{ color: '#697386', textDecoration: 'underline' }}>Privacy Policy</Link>.
            {' '}Powered by <Link href="/" style={{ color: '#697386' }}>JD AI Systems</Link>.
          </p>
        </footer>
      </div>
    </>
  )
}
