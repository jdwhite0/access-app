'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useMarketingAuthActions } from '@/components/marketing/useMarketingAuthActions'

const NAV_LEFT = [
  { label: 'Product', href: '/#product' },
  { label: 'Solutions', href: '/#solutions' },
  { label: 'Developers', href: '/#developers' },
  { label: 'Pricing', href: '/plans' },
] as const

export default function PublicHeader() {
  const { dashboardHref, handleDashboardClick, startBuilding } = useMarketingAuthActions()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      background: scrolled ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: scrolled ? '1px solid #E6EBF1' : '1px solid transparent',
      transition: 'border-color 0.2s, background 0.2s',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 clamp(20px, 3vw, 48px)',
        display: 'flex',
        alignItems: 'center',
        gap: 32,
      }}>
        {/* Wordmark */}
        <Link href="/" style={{
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#0A2540',
          textDecoration: 'none',
          fontFamily: 'var(--mono)',
          flexShrink: 0,
        }}>
          ACCESS
        </Link>

        {/* Center nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }} aria-label="Primary">
          {NAV_LEFT.map((item) => (
            <Link key={item.label} href={item.href} style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#425466',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 6,
              transition: 'color 0.15s, background 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#0A2540'; (e.currentTarget as HTMLAnchorElement).style.background = '#F7F8FA' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = '#425466'; (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right actions — Stripe hierarchy: ghost | outlined | filled */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Link
            href={dashboardHref}
            onClick={handleDashboardClick}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: '#425466',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 6,
            }}
          >
            Dashboard
          </Link>
          <Link href="/contact" style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#0A2540',
            textDecoration: 'none',
            padding: '7px 14px',
            borderRadius: 6,
            border: '1px solid #C8D6E5',
            transition: 'border-color 0.15s',
          }}>
            Contact sales
          </Link>
          <button
            onClick={startBuilding}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#FFFFFF',
              background: '#0A2540',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1a3550' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#0A2540' }}
          >
            Start now →
          </button>
        </div>
      </div>
    </header>
  )
}
