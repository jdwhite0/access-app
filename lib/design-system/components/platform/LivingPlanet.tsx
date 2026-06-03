'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '../cn'

type Particle = { x: number; y: number; vx: number; vy: number; r: number; a: number }

function seedParticles(count: number, w: number, h: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
    r: 0.4 + Math.random() * 1.2,
    a: 0.15 + Math.random() * 0.45,
  }))
}

type LivingPlanetProps = {
  className?: string
  /** Hero scale on home; default smaller for companion reuse later */
  variant?: 'hero' | 'standard'
}

export function LivingPlanet({ className, variant = 'hero' }: LivingPlanetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const frameRef = useRef<number>(0)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 120, damping: 22 })
  const sy = useSpring(my, { stiffness: 120, damping: 22 })
  const tiltX = useTransform(sy, [-0.5, 0.5], [4, -4])
  const tiltY = useTransform(sx, [-0.5, 0.5], [-4, 4])

  useEffect(() => {
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
      particlesRef.current = seedParticles(variant === 'hero' ? 48 : 28, rect.width, rect.height)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)

    const tick = () => {
      const w = canvas.width / (window.devicePixelRatio ?? 1)
      const h = canvas.height / (window.devicePixelRatio ?? 1)
      ctx.clearRect(0, 0, w, h)
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#40C0D0'

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
  }, [variant])

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function onPointerLeave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <div
      className={cn('access-living-planet', `access-living-planet--${variant}`, className)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-hidden
    >
      <canvas ref={canvasRef} className="access-living-planet__canvas" />
      <div className="access-living-planet__nebula" />
      <div className="access-living-planet__core-wrap" style={{ perspective: 900 }}>
        <motion.div
          className="access-living-planet__core-tilt"
          style={{ rotateX: tiltX, rotateY: tiltY }}
        >
        <motion.div
          className="access-living-planet__halo"
          animate={{ scale: [1, 1.05, 1], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="access-living-planet__body"
          animate={{ scale: [1, 1.015, 1] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="access-living-planet__crater" />
          <span className="access-living-planet__sheen" />
          <span className="access-living-planet__terminator" />
        </motion.div>
        <motion.span
          className="access-living-planet__ring"
          animate={{ rotate: 360 }}
          transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
        />
        </motion.div>
      </div>
    </div>
  )
}
