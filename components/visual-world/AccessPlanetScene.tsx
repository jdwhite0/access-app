'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/design-system/components/cn'

export type PlanetKind = 'access' | 'jyson' | 'founder' | 'memory'
export type PlanetScale = 'hero' | 'lg' | 'md' | 'sm'

type Particle = { x: number; y: number; vx: number; vy: number; r: number; a: number }

const KIND_ACCENT: Record<PlanetKind, string> = {
  access: 'var(--accent)',
  jyson: 'var(--accent)',
  founder: 'var(--gold, #c9a46a)',
  memory: '#8b9cf0',
}

type AccessPlanetSceneProps = {
  kind?: PlanetKind
  scale?: PlanetScale
  className?: string
  /** Particle field — off on sm orb for performance */
  particles?: boolean
  orbits?: boolean
  trails?: boolean
  interactive?: boolean
}

function seedParticles(count: number, w: number, h: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.12,
    vy: (Math.random() - 0.5) * 0.12,
    r: 0.35 + Math.random() * 1,
    a: 0.12 + Math.random() * 0.4,
  }))
}

export function AccessPlanetScene({
  kind = 'access',
  scale = 'hero',
  className,
  particles = true,
  orbits = true,
  trails = true,
  interactive = true,
}: AccessPlanetSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const frameRef = useRef(0)
  const accent = KIND_ACCENT[kind]
  const particleCount = scale === 'hero' ? 52 : scale === 'lg' ? 36 : scale === 'md' ? 24 : 0

  useEffect(() => {
    if (!particles || particleCount === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particlesRef.current = seedParticles(particleCount, rect.width, rect.height)
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const tick = () => {
      const w = canvas.width / (window.devicePixelRatio ?? 1)
      const h = canvas.height / (window.devicePixelRatio ?? 1)
      ctx.clearRect(0, 0, w, h)
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = accent
        ctx.globalAlpha = p.a
        ctx.fill()
      }
      ctx.globalAlpha = 1
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(frameRef.current)
    }
  }, [particles, particleCount, accent])

  return (
    <div
      className={cn('access-planet-scene', `access-planet-scene--${scale}`, `access-planet-scene--${kind}`, className)}
      style={{ '--planet-accent': accent } as React.CSSProperties}
      data-interactive={interactive ? 'true' : 'false'}
    >
      {particles && particleCount > 0 ? (
        <canvas ref={canvasRef} className="access-planet-scene__canvas" aria-hidden />
      ) : null}

      {trails ? (
        <svg className="access-planet-scene__trails" viewBox="0 0 200 200" aria-hidden>
          <defs>
            <linearGradient id={`trail-${kind}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor={accent} stopOpacity="0.35" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <motion.path
            d="M 20 100 Q 100 40 180 100"
            fill="none"
            stroke={`url(#trail-${kind})`}
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={{ pathLength: 1, opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 40 120 Q 100 160 160 80"
            fill="none"
            stroke={accent}
            strokeWidth="0.5"
            strokeOpacity="0.25"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          />
        </svg>
      ) : null}

      <div className="access-planet-scene__nebula" aria-hidden />

      {orbits ? (
        <>
          <motion.span
            className="access-planet-scene__orbit access-planet-scene__orbit--1"
            animate={{ rotate: 360 }}
            transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
          />
          <motion.span
            className="access-planet-scene__orbit access-planet-scene__orbit--2"
            animate={{ rotate: -360 }}
            transition={{ duration: 72, repeat: Infinity, ease: 'linear' }}
          />
        </>
      ) : null}

      <div className="access-planet-scene__core-wrap">
        <motion.div
          className="access-planet-scene__halo"
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="access-planet-scene__body"
          animate={{ scale: [1, 1.012, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="access-planet-scene__sheen" />
          <span className="access-planet-scene__terminator" />
        </motion.div>
      </div>
    </div>
  )
}
