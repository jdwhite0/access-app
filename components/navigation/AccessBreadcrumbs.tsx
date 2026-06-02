'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { buildBreadcrumbs } from '@/lib/navigation/breadcrumbs'
import { FOUNDER_CONTEXT, SETTINGS_CONTEXT } from '@/lib/navigation/config'
import {
  resolveCompanionContext,
  resolveFounderContext,
  resolvePrimaryNavId,
  resolveSettingsContext,
} from '@/lib/navigation/resolve-nav'
import type { BreadcrumbSegment } from '@/lib/navigation/types'

type AccessBreadcrumbsProps = {
  extra?: BreadcrumbSegment[]
}

export default function AccessBreadcrumbs({ extra }: AccessBreadcrumbsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [hash, setHash] = useState('')

  useEffect(() => {
    const sync = () => setHash(window.location.hash)
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const primary = resolvePrimaryNavId(pathname)
  const founderContext = resolveFounderContext(searchParams)
  const companionContext = resolveCompanionContext(hash)
  const settingsId = resolveSettingsContext(pathname)
  const settingsLabel =
    SETTINGS_CONTEXT.find((c) => c.id === settingsId)?.label ?? null

  const segments = buildBreadcrumbs({
    primary,
    founderContext,
    companionContext,
    settingsContextLabel:
      primary === 'settings' && settingsId !== 'general' ? settingsLabel : null,
    extraTail: extra,
  })

  return (
    <nav className="access-nav-breadcrumbs" aria-label="Breadcrumb">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1
        return (
          <span key={`${seg.label}-${i}`} style={{ display: 'contents' }}>
            {i > 0 && (
              <span className="access-nav-breadcrumb-sep" aria-hidden>
                →
              </span>
            )}
            {isLast || !seg.href ? (
              <span className="access-nav-breadcrumb-current" aria-current="page">
                {seg.label}
              </span>
            ) : i === 0 ? (
              <Link href={seg.href} className="access-nav-breadcrumb-root">
                {seg.label}
              </Link>
            ) : (
              <Link href={seg.href} className="access-nav-breadcrumb-link">
                {seg.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
