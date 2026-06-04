'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { AccessPlanetScene } from '@/components/visual-world'
import {
  localToolsLabel,
  cloudStatusLabel,
  fileToolsActiveLabel,
  localIntelligenceActiveLabel,
} from '@/lib/access/status-labels'
import { buildJysonSuggestions } from '@/lib/jyson-layer/contextual-awareness'
import { isJysonErrorReply } from '@/lib/jyson-layer/format-chat-error'
import { useOpenJarvisHealth } from '@/lib/openjarvis/use-openjarvis-health'
import { useJysonLayer } from './JysonLayerProvider'
import { JysonProcessingActivityCard } from './JysonProcessingActivityCard'

export default function JysonPersistentLayer() {
  const {
    open,
    collapsed,
    toggle,
    setOpen,
    messages,
    busy,
    isProcessing,
    processingAnchorId,
    processingPhase,
    processingError,
    isStreaming,
    submit,
    retryLastSubmit,
    contextLine,
    greeting,
    route,
    summary,
    pageContext,
  } = useJysonLayer()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const {
    loading: healthLoading,
    fileToolsLive,
    localIntelligenceActive,
    showSetupCta,
  } = useOpenJarvisHealth({ pollIntervalMs: 30_000 })

  const suggestions = useMemo(
    () => buildJysonSuggestions(route, summary),
    [route, summary]
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, processingPhase, processingError, busy, isProcessing])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
  }, [open])

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

  const toolsLine = healthLoading
    ? 'Checking optional file tools…'
    : fileToolsLive
      ? fileToolsActiveLabel(true)
      : localIntelligenceActive
        ? localIntelligenceActiveLabel(true)
        : localToolsLabel(false)

  const cloudLine = cloudStatusLabel(true)

  const showProcessingCard = Boolean(
    processingAnchorId && (isProcessing || processingError !== null)
  )
  const anchorInMessages =
    processingAnchorId !== null &&
    messages.some((m) => m.id === processingAnchorId)

  return (
    <div
      className="access-jyson-layer"
      data-open={open ? 'true' : 'false'}
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              className="access-jyson-layer__backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              aria-label="Close JYSON panel"
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={panelRef}
              className="access-jyson-layer__panel"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="JYSON"
              tabIndex={-1}
            >
              <header className="access-jyson-layer__head">
                <div>
                  <p className="access-jyson-layer__greeting">{greeting}</p>
                  <p className="access-jyson-layer__insight">
                    {pageContext.title} — {pageContext.purpose}
                  </p>
                  <p className="access-jyson-layer__context">{contextLine}</p>
                </div>
                <button
                  type="button"
                  className="access-jyson-layer__close"
                  onClick={() => setOpen(false)}
                  aria-label="Close JYSON (Escape)"
                >
                  ×
                </button>
              </header>

              <p
                className="access-jyson-layer__tools"
                title="File intelligence needs the local stack. Vault excerpt answers work without the connector."
              >
                {cloudLine} · {toolsLine}
                {showSetupCta ? (
                  <>
                    {' · '}
                    <Link
                      href="/agents?connect=tools#execution"
                      className="access-jyson-layer__foot-link"
                      onClick={() => setOpen(false)}
                    >
                      Set up on this Mac
                    </Link>
                  </>
                ) : null}
              </p>

              <nav className="access-jyson-layer__links" aria-label="Related pages">
                {pageContext.relatedRoutes.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="access-jyson-layer__chip access-jyson-layer__chip--link"
                    onClick={() => setOpen(false)}
                  >
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

              <section
                className="access-jyson-layer__conversation"
                aria-label="JYSON conversation"
              >
                <div className="access-jyson-layer__messages">
                  {messages.map((m) => {
                    const showActivity =
                      showProcessingCard && m.id === processingAnchorId
                    return (
                      <div key={m.id} className="access-jyson-layer__msg-wrap">
                        <div
                          className={[
                            `access-jyson-layer__msg access-jyson-layer__msg--${m.role}`,
                            m.role === 'jyson' && isJysonErrorReply(m.text)
                              ? 'access-jyson-layer__msg--error'
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          role={
                            m.role === 'jyson' && isJysonErrorReply(m.text) ? 'alert' : undefined
                          }
                        >
                          {m.text}
                        </div>
                        {showActivity ? (
                          <JysonProcessingActivityCard
                            phase={processingPhase}
                            isStreaming={isStreaming}
                            active={isProcessing || processingError !== null}
                            error={processingError}
                            onRetry={processingError?.retryable ? retryLastSubmit : undefined}
                          />
                        ) : null}
                      </div>
                    )
                  })}
                  {showProcessingCard && !anchorInMessages ? (
                    <div className="access-jyson-layer__msg-wrap">
                      <JysonProcessingActivityCard
                        phase={processingPhase}
                        isStreaming={isStreaming}
                        active={isProcessing || processingError !== null}
                        error={processingError}
                        onRetry={processingError?.retryable ? retryLastSubmit : undefined}
                      />
                    </div>
                  ) : null}
                  <div ref={bottomRef} />
                </div>
              </section>

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
          </>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        className="access-jyson-layer__orb-btn"
        onClick={toggle}
        aria-label={open ? 'Collapse JYSON' : 'Open JYSON'}
        aria-expanded={open}
        aria-haspopup="dialog"
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
