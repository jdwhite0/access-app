'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { AccessPlanetScene } from '@/components/visual-world'
import { localToolsLabel, cloudStatusLabel } from '@/lib/access/status-labels'
import { buildJysonSuggestions } from '@/lib/jyson-layer/contextual-awareness'
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
    layerInsight,
    route,
    summary,
    pageContext,
  } = useJysonLayer()
  const [input, setInput] = useState('')
  const [localTools, setLocalTools] = useState<boolean | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(
    () => buildJysonSuggestions(route, summary),
    [route, summary]
  )

  useEffect(() => {
    fetch('/api/jyson/openjarvis/health', { cache: 'no-store' })
      .then((r) => r.json() as Promise<{ runtime?: { localToolsAvailable?: boolean } }>)
      .then((d) => setLocalTools(!!d.runtime?.localToolsAvailable))
      .catch(() => setLocalTools(false))
  }, [open])

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

  function onSuggestion(prompt: string) {
    if (!prompt) return
    void submit(prompt)
  }

  const toolsLine = localTools === null
    ? 'Checking local tools…'
    : localToolsLabel(localTools)

  const cloudLine = cloudStatusLabel(true)

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
                <p className="access-jyson-layer__insight">{pageContext.title} — {pageContext.purpose}</p>
                <p className="access-jyson-layer__context">{contextLine}</p>
              </div>
              <button
                type="button"
                className="access-jyson-layer__close"
                onClick={() => setOpen(false)}
                aria-label="Close JYSON"
              >
                ×
              </button>
            </header>

            <p className="access-jyson-layer__tools">
              {cloudLine} · {toolsLine}
            </p>

            <nav className="access-jyson-layer__links" aria-label="Related pages">
              {pageContext.relatedRoutes.map((r) => (
                <Link key={r.href} href={r.href} className="access-jyson-layer__chip access-jyson-layer__chip--link">
                  {r.label}
                </Link>
              ))}
            </nav>

            <div className="access-jyson-layer__suggestions" role="group" aria-label="Suggested prompts">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="access-jyson-layer__chip"
                  disabled={busy}
                  onClick={() => onSuggestion(s.prompt)}
                >
                  {s.label}
                </button>
              ))}
            </div>

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
                Open full JYSON view
              </Link>
            </footer>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        className="access-jyson-layer__orb-btn"
        onClick={toggle}
        aria-label={open ? 'Close JYSON' : 'Ask JYSON'}
        aria-expanded={open}
      >
        <AccessPlanetScene
          kind="jyson"
          scale="sm"
          particles={false}
          trails={false}
          orbits
          className="access-jyson-layer__orb"
        />
        <span className="access-jyson-layer__orb-label">JYSON</span>
      </button>
    </div>
  )
}
