'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Overview', href: '/admin', icon: '◈' },
  { label: 'Users', href: '/admin/users', icon: '⬡' },
  { label: 'System', href: '/admin/system', icon: '◉' },
  { label: 'Coupons', href: '/admin/coupons', icon: '◎' },
] as const

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <aside style={{
      width: 200,
      flexShrink: 0,
      borderRight: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
    }}>
      <div style={{ padding: '0 16px 20px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 4px' }}>ACCESS</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', fontFamily: 'var(--mono)', margin: 0, letterSpacing: '0.06em' }}>FOUNDER ADMIN</p>
      </div>
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {NAV.map((item) => {
          const active = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 6,
                marginBottom: 2,
                textDecoration: 'none',
                background: active ? 'rgba(64,192,208,0.08)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-dim)',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                transition: 'background 0.12s, color 0.12s',
              }}
            >
              <span style={{ fontSize: 13, width: 16, flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <Link href="/dashboard" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--mono)' }}>
          ← Back to ACCESS
        </Link>
      </div>
    </aside>
  )
}
