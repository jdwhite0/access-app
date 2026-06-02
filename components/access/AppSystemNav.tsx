'use client'

import Link from 'next/link'
import { useClerk } from '@clerk/nextjs'

const JYSON_URL = process.env.NEXT_PUBLIC_JYSON_URL ?? 'https://jyson.vercel.app'

export type AppNavSection = 'terminal' | 'founder' | 'companion' | 'project'

type NavItem = {
  id: AppNavSection | 'jyson-external' | 'command-center'
  label: string
  href: string
  external?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'terminal', label: 'Dashboard', href: '/' },
  { id: 'founder', label: 'Blueprint', href: '/founder' },
  { id: 'companion', label: 'Companion', href: '/companion' },
  { id: 'command-center', label: 'System', href: '/internal/command-center' },
  { id: 'jyson-external', label: 'JYSON', href: JYSON_URL, external: true },
]

type AppSystemNavProps = {
  active: AppNavSection
  /** Optional ACCESS handle shown on the right */
  accessId?: string | null
  compact?: boolean
}

export default function AppSystemNav({ active, accessId, compact = false }: AppSystemNavProps) {
  const { signOut } = useClerk()

  return (
    <header
      className={`app-system-nav${compact ? ' app-system-nav--compact' : ''}`}
      role="navigation"
      aria-label="ACCESS system"
    >
      <div className="app-system-nav-brand">
        <Link href="/" className="app-system-nav-logo">
          ACCESS
        </Link>
        {!compact && (
          <span className="app-system-nav-sub">JD AI Systems</span>
        )}
      </div>

      <nav className="app-system-nav-links">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === active || (item.id === 'terminal' && active === 'terminal')
          const className = `app-system-nav-link${isActive ? ' is-active' : ''}`

          if (item.external) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {item.label}
                <span className="app-system-nav-ext" aria-hidden>
                  ↗
                </span>
              </a>
            )
          }

          return (
            <Link key={item.id} href={item.href} className={className}>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="app-system-nav-meta">
        {accessId && (
          <>
            <span className="app-system-nav-meta-label">id</span>
            <span className="app-system-nav-meta-value">{accessId}</span>
          </>
        )}
        <button
          type="button"
          className="app-system-nav-signout"
          onClick={() => signOut({ redirectUrl: '/' })}
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
