'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useMarketingAuthActions } from '@/components/marketing/useMarketingAuthActions'

const NAV_LEFT = [
  { label: 'Product',   href: '/#product' },
  { label: 'Solutions', href: '/#solutions' },
  { label: 'Developers', href: '/#developers' },
  { label: 'Pricing',  href: '/plans' },
] as const

export default function PublicHeader() {
  const { dashboardHref, handleDashboardClick, startBuilding } = useMarketingAuthActions()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid #E6EBF1' : '1px solid transparent',
        transition: 'border-color 0.2s, background 0.2s',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 clamp(16px, 3vw, 48px)',
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

          {/* Desktop center nav */}
          <nav className="access-mkt-header__nav" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }} aria-label="Primary">
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

          {/* Desktop right actions */}
          <div className="access-mkt-header__actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
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
            <Link href="/contact" className="access-mkt-header__contact-btn" style={{
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

          {/* Mobile hamburger */}
          <button
            className="access-mkt-header__hamburger"
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((o) => !o)}
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#0A2540',
              fontSize: 22,
              padding: 0,
              marginLeft: 'auto',
              WebkitTapHighlightColor: 'transparent',
              borderRadius: 8,
              flexShrink: 0,
            }}
          >
            {mobileMenuOpen ? '✕' : '≡'}
          </button>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 64,
          }}
        >
          <nav style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 24px 0',
            gap: 4,
          }}>
            {NAV_LEFT.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMobileMenu}
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: '#0A2540',
                  textDecoration: 'none',
                  padding: '14px 0',
                  borderBottom: '1px solid #F0F4F8',
                  display: 'block',
                }}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={dashboardHref}
              onClick={(e) => { handleDashboardClick(e); closeMobileMenu() }}
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: '#0A2540',
                textDecoration: 'none',
                padding: '14px 0',
                borderBottom: '1px solid #F0F4F8',
                display: 'block',
              }}
            >
              Dashboard
            </Link>
          </nav>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => { startBuilding(); closeMobileMenu() }}
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#FFFFFF',
                background: '#0A2540',
                border: 'none',
                borderRadius: 8,
                padding: '14px 24px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Start for free →
            </button>
            <Link
              href="/contact"
              onClick={closeMobileMenu}
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: '#0A2540',
                textDecoration: 'none',
                padding: '13px 24px',
                border: '1px solid #C8D6E5',
                borderRadius: 8,
                textAlign: 'center',
                display: 'block',
              }}
            >
              Contact sales
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .access-mkt-header__nav { display: none !important; }
          .access-mkt-header__contact-btn { display: none !important; }
          .access-mkt-header__actions button { display: none !important; }
          .access-mkt-header__hamburger { display: flex !important; }
        }
      `}</style>
    </>
  )
}
