'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bot, Home, Layers, Users } from 'lucide-react'

const TABS = [
  { href: '/dashboard', label: 'Home', match: (p: string) => p === '/dashboard' || p === '/', Icon: Home },
  { href: '/companion', label: 'JYSON', match: (p: string) => p.startsWith('/companion'), Icon: Bot },
  { href: '/vaults', label: 'Vault', match: (p: string) => p.startsWith('/vaults'), Icon: Layers },
  { href: '/agents', label: 'Team', match: (p: string) => p.startsWith('/agents'), Icon: Users },
] as const

type AccessMobileTabBarProps = {
  hidden?: boolean
}

export default function AccessMobileTabBar({ hidden }: AccessMobileTabBarProps) {
  const pathname = usePathname() ?? ''
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (hidden || !mounted) return null

  return createPortal(
    <nav className="access-mobile-tabbar" aria-label="Primary">
      {TABS.map(({ href, label, match, Icon }) => {
        const active = match(pathname)
        return (
          <Link
            key={href}
            href={href}
            className={`access-mobile-tabbar__item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={22} strokeWidth={1.75} aria-hidden />
            <span className="access-mobile-tabbar__label">{label}</span>
          </Link>
        )
      })}
    </nav>,
    document.body
  )
}
