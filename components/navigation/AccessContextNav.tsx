'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  COMPANION_CONTEXT,
  FOUNDER_CONTEXT,
  SETTINGS_CONTEXT,
} from '@/lib/navigation/config'
import {
  resolveCompanionContext,
  resolveFounderContext,
  resolvePrimaryNavId,
  resolveSettingsContext,
} from '@/lib/navigation/resolve-nav'

export default function AccessContextNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const primary = resolvePrimaryNavId(pathname)
  const [hash, setHash] = useState('')

  useEffect(() => {
    const sync = () => setHash(window.location.hash)
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  let items = null as typeof FOUNDER_CONTEXT | null
  let activeId: string | null = null

  if (primary === 'founder') {
    items = FOUNDER_CONTEXT
    activeId = resolveFounderContext(searchParams)
  } else if (primary === 'companion') {
    items = COMPANION_CONTEXT
    activeId = resolveCompanionContext(hash) ?? 'overview'
  } else if (primary === 'settings' || pathname.startsWith('/terminal')) {
    items = SETTINGS_CONTEXT
    activeId = resolveSettingsContext(pathname)
  }

  if (!items?.length) return null

  return (
    <>
      <p className="access-nav-section-label">Section</p>
      <ul className="access-nav-context">
        {items.map((item) => {
          const isActive = item.id === activeId
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`access-nav-link${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="access-nav-link__label">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
