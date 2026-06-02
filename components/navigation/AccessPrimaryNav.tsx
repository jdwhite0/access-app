'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PRIMARY_NAV } from '@/lib/navigation/config'
import { resolvePrimaryNavId } from '@/lib/navigation/resolve-nav'

export default function AccessPrimaryNav() {
  const pathname = usePathname()
  const active = resolvePrimaryNavId(pathname)

  return (
    <>
      <p className="access-nav-section-label">Navigate</p>
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
                  {item.glyph}
                </span>
                <span className="access-nav-link__label">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}
