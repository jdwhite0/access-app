'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** Scrolls to companion section anchors when hash changes — navigation only. */
export default function CompanionHashScroll() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname.startsWith('/companion')) return

    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, '')
      if (!id) return
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => window.removeEventListener('hashchange', scrollToHash)
  }, [pathname])

  return null
}
