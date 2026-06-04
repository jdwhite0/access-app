'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { cn } from '../components/cn'

export type ACCESSShellProps = {
  topbar: ReactNode
  navigation: ReactNode
  children: ReactNode
  context?: ReactNode
  className?: string
  /** Alias for legacy access-os-shell class hooks */
  legacyClassName?: string
}

export function ACCESSShell({
  topbar,
  navigation,
  children,
  context,
  className,
  legacyClassName = 'access-os-shell',
}: ACCESSShellProps) {
  const [railOpen, setRailOpen] = useState(false)

  const closeRail = useCallback(() => setRailOpen(false), [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const onChange = () => {
      if (!mq.matches) setRailOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return (
    <div
      className={cn(
        'access-ds-shell',
        'access-platform',
        legacyClassName,
        railOpen && 'is-rail-open access-os-rail-open',
        className
      )}
    >
      <header className={cn('access-ds-shell__topbar', 'access-os-topbar')}>
        {/* Mobile: [Menu] | wordmark center | placeholder right */}
        <button
          type="button"
          className="access-ds-shell__mobile-toggle"
          aria-label={railOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={railOpen}
          onClick={() => setRailOpen((o) => !o)}
        >
          {railOpen ? '✕' : '≡'}
        </button>
        <div className="access-ds-shell__topbar-inner">{topbar}</div>
      </header>

      <div
        className={cn(
          'access-ds-shell__body',
          context ? 'access-ds-shell__body--with-context' : undefined,
          'access-os-body'
        )}
      >
        <nav
          className={cn('access-ds-shell__rail', 'access-os-rail')}
          aria-label="Module navigation"
          onClick={(e) => {
            const t = e.target as HTMLElement
            if (t.closest('a') || t.closest('button')) closeRail()
          }}
        >
          {navigation}
        </nav>

        <main className={cn('access-ds-shell__main', 'access-os-workspace')}>{children}</main>

        {context ? (
          <aside className={cn('access-ds-shell__context', 'access-os-context')}>
            {context}
          </aside>
        ) : null}
      </div>

      <button
        type="button"
        className="access-ds-shell__backdrop"
        aria-hidden={!railOpen}
        tabIndex={railOpen ? 0 : -1}
        onClick={closeRail}
      />
    </div>
  )
}
