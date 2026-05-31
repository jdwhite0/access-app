'use client'

import { useAuth } from '@clerk/nextjs'
import TerminalLanding from '@/components/TerminalLanding'
import CommandCenter from '@/components/CommandCenter'

export default function Page() {
  const { isSignedIn, isLoaded } = useAuth()

  return (
    <div className="relative h-full scanline">
      {/* Ambient grid — very subtle */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(64,192,208,1) 1px, transparent 1px), linear-gradient(90deg, rgba(64,192,208,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Loading state — brief flash while Clerk initializes */}
      {!isLoaded && (
        <div className="h-full flex items-center justify-center">
          <div className="text-xs tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
            ACCESS<span className="cursor" />
          </div>
        </div>
      )}

      {isLoaded && !isSignedIn && <TerminalLanding />}
      {isLoaded && isSignedIn && <CommandCenter />}
    </div>
  )
}
