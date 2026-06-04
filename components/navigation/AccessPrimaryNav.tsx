'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PRIMARY_NAV, NAV_GROUP_LABELS } from '@/lib/navigation/config'
import { navIconFor } from '@/lib/navigation/nav-icons'
import { resolvePrimaryNavId } from '@/lib/navigation/resolve-nav'
import type { NavGroup } from '@/lib/navigation/types'

const GROUP_ORDER: NavGroup[] = ['main', 'intelligence', 'platform', 'founder']

export default function AccessPrimaryNav() {
  const pathname = usePathname()
  const active = resolvePrimaryNavId(pathname)
  const [plan, setPlan] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/identity/plan', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { plan?: string } | null) => { if (d?.plan) setPlan(d.plan) })
      .catch(() => {})
  }, [])

  const isFounder = plan === 'founder'

  return (
    <>
      {GROUP_ORDER.map((group) => {
        const items = PRIMARY_NAV.filter((item) => item.group === group)
        // Skip founder group entirely for non-founders
        if (group === 'founder' && !isFounder) return null
        if (items.length === 0) return null

        return (
          <div key={group}>
            <p className="access-nav-section-label">{NAV_GROUP_LABELS[group]}</p>
            <ul className="access-nav-primary">
              {items.map((item) => {
                const isActive = item.id === active
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`access-nav-link${isActive ? ' is-active' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="access-nav-link__glyph" aria-hidden>
                        {(() => {
                          const Icon = navIconFor(item.id)
                          return <Icon size={16} strokeWidth={1.75} />
                        })()}
                      </span>
                      <span className="access-nav-link__text">
                        <span className="access-nav-link__label">{item.label}</span>
                        <span className="access-nav-link__subtitle">{item.subtitle}</span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </>
  )
}
