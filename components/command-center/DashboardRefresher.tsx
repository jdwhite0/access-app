'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { intervalMs: number }

export default function DashboardRefresher({ intervalMs }: Props) {
  const router = useRouter()
  const [lastRefreshed, setLastRefreshed] = useState<string>('')
  const [countdown, setCountdown] = useState(Math.round(intervalMs / 1000))

  useEffect(() => {
    setLastRefreshed(new Date().toLocaleTimeString())
  }, [])

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          router.refresh()
          setLastRefreshed(new Date().toLocaleTimeString())
          return Math.round(intervalMs / 1000)
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [router, intervalMs])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        fontSize: '0.68rem',
        color: 'var(--text-muted)',
        letterSpacing: '0.06em',
        fontFamily: 'var(--mono)',
      }}
    >
      {lastRefreshed && <span>REFRESHED {lastRefreshed}</span>}
      <span style={{ color: 'var(--accent)', opacity: 0.6 }}>
        NEXT IN {countdown}s
      </span>
    </div>
  )
}
