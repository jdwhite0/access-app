'use client'

import { useEffect, useRef } from 'react'

/**
 * Stripe-style animated gradient mesh — three color orbs (orange, purple, red)
 * that drift and blend in a canvas, overlaid on the hero section.
 */
export default function GradientMeshHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf: number
    let t = 0

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    window.addEventListener('resize', resize)
    resize()

    const orbs = [
      { r: 0.72, g: 0.24, b: 0.08, x: 0.15, y: 0.25, rx: 0.22, ry: 0.18, speed: 0.0008, phase: 0 },    // deep orange-red
      { r: 0.52, g: 0.10, b: 0.82, x: 0.75, y: 0.35, rx: 0.28, ry: 0.22, speed: 0.0006, phase: 2.1 },   // purple
      { r: 0.82, g: 0.14, b: 0.22, x: 0.50, y: 0.70, rx: 0.20, ry: 0.25, speed: 0.0007, phase: 4.2 },   // red
      { r: 0.62, g: 0.06, b: 0.52, x: 0.30, y: 0.55, rx: 0.18, ry: 0.15, speed: 0.0009, phase: 1.0 },   // dark magenta
    ]

    function draw() {
      if (!canvas || !ctx) return
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      ctx.clearRect(0, 0, w, h)

      // Dark base
      ctx.fillStyle = '#030008'
      ctx.fillRect(0, 0, w, h)

      // Draw each orb as a radial gradient
      for (const orb of orbs) {
        const cx = (orb.x + Math.sin(t * orb.speed * 1000 + orb.phase) * orb.rx) * w
        const cy = (orb.y + Math.cos(t * orb.speed * 800 + orb.phase) * orb.ry) * h
        const radius = Math.min(w, h) * 0.65

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        grad.addColorStop(0, `rgba(${Math.round(orb.r * 255)}, ${Math.round(orb.g * 255)}, ${Math.round(orb.b * 255)}, 0.72)`)
        grad.addColorStop(0.4, `rgba(${Math.round(orb.r * 255)}, ${Math.round(orb.g * 255)}, ${Math.round(orb.b * 255)}, 0.28)`)
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.globalCompositeOperation = 'screen'
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      // Noise vignette overlay
      ctx.globalCompositeOperation = 'source-over'
      const vignette = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75)
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, 'rgba(0,0,8,0.65)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, w, h)

      t++
      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}
