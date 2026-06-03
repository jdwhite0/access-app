'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { LivingPlanet } from '@/lib/design-system/components/platform'
import { useJysonLayer } from './JysonLayerProvider'

export default function JysonPersistentLayer() {
  const {
    open,
    toggle,
    setOpen,
    messages,
    busy,
    submit,
    contextLine,
    greeting,
  } = useJysonLayer()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setInput('')
    await submit(text)
  }

  return (
    <div className="access-jyson-layer" data-open={open ? 'true' : 'false'}>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="access-jyson-layer__panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label="JYSON"
          >
            <header className="access-jyson-layer__head">
              <div>
                <p className="access-jyson-layer__greeting">{greeting}</p>
                <p className="access-jyson-layer__context">{contextLine}</p>
              </div>
              <button
                type="button"
                className="access-jyson-layer__close"
                onClick={() => setOpen(false)}
                aria-label="Collapse JYSON"
              >
                ×
              </button>
            </header>

            <div className="access-jyson-layer__messages">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`access-jyson-layer__msg access-jyson-layer__msg--${m.role}`}
                >
                  {m.text}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form className="access-jyson-layer__form" onSubmit={onSubmit}>
              <input
                className="access-jyson-layer__input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask JYSON anything…"
                disabled={busy}
                aria-label="Ask JYSON"
              />
              <button type="submit" className="access-jyson-layer__send" disabled={busy || !input.trim()}>
                {busy ? '…' : 'Send'}
              </button>
            </form>

            <footer className="access-jyson-layer__foot">
              <Link href="/companion" className="access-jyson-layer__foot-link">
                Full intelligence view
              </Link>
            </footer>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        className="access-jyson-layer__orb-btn"
        onClick={toggle}
        aria-label={open ? 'Collapse JYSON' : 'Open JYSON'}
        aria-expanded={open}
      >
        <LivingPlanet variant="standard" className="access-jyson-layer__orb" />
        <span className="access-jyson-layer__orb-label">JYSON</span>
      </button>
    </div>
  )
}
