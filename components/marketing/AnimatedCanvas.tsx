'use client'

import { useEffect, useRef } from 'react'

interface Blob {
  baseX: number
  baseY: number
  radius: number
  r: number
  g: number
  b: number
  phase: number
  speed: number
}

const BLOBS: Blob[] = [
  { baseX: 0.75, baseY: 0.28, radius: 0.50, r: 124, g: 108, b: 248, phase: 0.0,  speed: 0.00028 }, // purple
  { baseX: 0.15, baseY: 0.65, radius: 0.42, r: 64,  g: 192, b: 208, phase: 2.1,  speed: 0.00034 }, // teal
  { baseX: 0.85, baseY: 0.72, radius: 0.38, r: 210, g: 70,  b: 170, phase: 4.2,  speed: 0.00031 }, // pink-purple
  { baseX: 0.45, baseY: 0.08, radius: 0.32, r: 26,  g: 143, b: 160, phase: 1.5,  speed: 0.00022 }, // dark teal
  { baseX: 0.92, baseY: 0.45, radius: 0.40, r: 80,  g: 50,  b: 230, phase: 3.0,  speed: 0.00040 }, // blue-violet
  { baseX: 0.30, baseY: 0.90, radius: 0.35, r: 180, g: 90,  b: 240, phase: 5.1,  speed: 0.00026 }, // violet
]

export default function AnimatedCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let time = 0

    const resize = () => {
      // Render at half resolution, CSS scales it up — big perf win
      canvas.width  = Math.floor(window.innerWidth  / 2)
      canvas.height = Math.floor(window.innerHeight / 2)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      time++
      const w = canvas.width
      const h = canvas.height

      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = 'rgb(6,13,24)'
      ctx.fillRect(0, 0, w, h)

      ctx.globalCompositeOperation = 'screen'

      BLOBS.forEach((blob) => {
        const t = time * blob.speed
        const cx = (blob.baseX + Math.sin(t + blob.phase) * 0.14) * w
        const cy = (blob.baseY + Math.cos(t * 1.27 + blob.phase) * 0.11) * h
        const r  = blob.radius * Math.min(w, h)

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        grad.addColorStop(0,    `rgba(${blob.r},${blob.g},${blob.b},0.26)`)
        grad.addColorStop(0.35, `rgba(${blob.r},${blob.g},${blob.b},0.14)`)
        grad.addColorStop(0.7,  `rgba(${blob.r},${blob.g},${blob.b},0.05)`)
        grad.addColorStop(1,    `rgba(${blob.r},${blob.g},${blob.b},0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        imageRendering: 'auto',
        willChange: 'transform',
      }}
    />
  )
}
