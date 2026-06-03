'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

function companionScrollRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '.access-app-layout--companion .access-ds-shell__main'
  )
}

/** Scrolls to companion section anchors inside the shell scroll container (body is overflow:hidden). */
export default function CompanionHashScroll() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname.startsWith('/companion')) return

    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, '')
      if (!id) return
      const target = document.getElementById(id)
      if (!target) return

      const root = companionScrollRoot()
      if (!root) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }

      const rootRect = root.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const top = root.scrollTop + (targetRect.top - rootRect.top) - 16
      root.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    }

    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => window.removeEventListener('hashchange', scrollToHash)
  }, [pathname])

  return null
}
