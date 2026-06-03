'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PRIMARY_NAV } from '@/lib/navigation/config'
import { navIconFor } from '@/lib/navigation/nav-icons'
import { resolvePrimaryNavId } from '@/lib/navigation/resolve-nav'

export default function AccessPrimaryNav() {
  const pathname = usePathname()
  const active = resolvePrimaryNavId(pathname)

  return (
    <>
      <p className="access-nav-section-label">Menu</p>
      <ul className="access-nav-primary">
        {PRIMARY_NAV.map((item) => {
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
                    return <Icon size={18} strokeWidth={1.75} />
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
    </>
  )
}
