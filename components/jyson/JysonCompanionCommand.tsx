'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { routeCompanionCommand } from '@/lib/jyson-bridge/companion-command-router'
import type { OpenJarvisRuntimeCard } from '@/lib/openjarvis-bridge/runtime-card'
import type { OpenJarvisRuntimeState } from '@/lib/openjarvis/resolve-runtime-state'
import JysonOrb, { type JysonOrbState } from '@/components/jyson/JysonOrb'
import JysonRuntimeCard from '@/components/jyson/JysonRuntimeCard'

type TranscriptLine = {
  id: number
  role: 'user' | 'jyson'
  text: string
}

type ExecutePayload = {
  success: boolean
  error?: string
  runtimeCard?: OpenJarvisRuntimeCard
}

type ToolsPayload = {
  runtime: OpenJarvisRuntimeState
}

let lineId = 0
function nextLineId() {
  return ++lineId
}

type JysonCompanionCommandProps = {
  handle: string
  cloudReady: boolean
  localConnected: boolean
}

export default function JysonCompanionCommand({
  handle,
  cloudReady,
  localConnected,
}: JysonCompanionCommandProps) {
  const [input, setInput] = useState('')
  const [orbState, setOrbState] = useState<JysonOrbState>('idle')
  const [statusLine, setStatusLine] = useState<string | undefined>()
  const [transcript, setTranscript] = useState<TranscriptLine[]>([
    {
      id: nextLineId(),
      role: 'jyson',
      text: 'Ask me to read a file or explore a folder on your machine. I route through ACCESS and OpenJarvis.',
    },
  ])
  const [runtime, setRuntime] = useState<OpenJarvisRuntimeState | null>(null)
  const [lastCard, setLastCard] = useState<{
    card: OpenJarvisRuntimeCard
    apiSuccess: boolean
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const loadRuntime = useCallback(async () => {
    try {
      const res = await fetch('/api/jyson/openjarvis/tools', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as ToolsPayload
      setRuntime(data.runtime)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void loadRuntime()
  }, [loadRuntime])

  useEffect(() => {
    if (!lastCard) return
    const root = document.querySelector<HTMLElement>(
      '.access-app-layout--companion .access-ds-shell__main'
    )
    const el = resultRef.current
    if (!el) return
    requestAnimationFrame(() => {
      if (root) {
        const rootRect = root.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        root.scrollTo({
          top: root.scrollTop + (elRect.top - rootRect.top) - 24,
          behavior: 'smooth',
        })
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    })
  }, [lastCard])

  const runChat = useCallback(async (text: string, prior: TranscriptLine[]) => {
      setOrbState('thinking')
      setStatusLine('Connecting to JYSON…')
      const history = [...prior, { id: 0, role: 'user' as const, text }]
        .filter((l) => l.role === 'user' || l.role === 'jyson')
        .map((l) => ({
          role: l.role === 'user' ? 'user' : 'assistant',
          content: l.text,
        }))

      try {
        const res = await fetch('/api/jyson/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
        })
        if (!res.ok || !res.body) {
          setTranscript((prev) => [
            ...prev,
            { id: nextLineId(), role: 'jyson', text: 'JYSON cloud chat is unavailable right now.' },
          ])
          setOrbState('error')
          return
        }
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let accumulated = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          for (const line of dec.decode(value).split('\n')) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data) as { text?: string }
              if (parsed.text) accumulated += parsed.text
            } catch {
              /* partial */
            }
          }
        }
        setTranscript((prev) => [
          ...prev,
          { id: nextLineId(), role: 'jyson', text: accumulated || '…' },
        ])
        setOrbState('idle')
        setStatusLine(undefined)
      } catch {
        setTranscript((prev) => [
          ...prev,
          { id: nextLineId(), role: 'jyson', text: 'Connection interrupted.' },
        ])
        setOrbState('error')
      }
    }, [])

  const runExecute = useCallback(
    async (
      toolId: 'read_file' | 'list_files',
      params: Record<string, unknown>,
      intent: string
    ) => {
      if (!runtime?.localToolsAvailable) {
        setTranscript((prev) => [
          ...prev,
          {
            id: nextLineId(),
            role: 'jyson',
            text:
              runtime?.message ??
              'Local tools need Private JYSON, connector heartbeat, and OpenJarvis running.',
          },
        ])
        setOrbState('error')
        setStatusLine('Local stack offline')
        return
      }

      setOrbState('executing')
      setStatusLine(intent)
      setLastCard(null)

      try {
        const res = await fetch('/api/jyson/openjarvis/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId, params }),
        })
        const body = (await res.json()) as ExecutePayload & { error?: string }
        if (body.runtimeCard) {
          const card = body.runtimeCard
          setLastCard({ card, apiSuccess: body.success })
          const ok = card.success && body.success
          setOrbState(ok ? 'success' : 'error')
          setStatusLine(ok ? intent : card.error ?? 'Execution failed')
          setTranscript((prev) => [
            ...prev,
            {
              id: nextLineId(),
              role: 'jyson',
              text: ok
                ? `Done — ${intent}. See result below.`
                : (card.error ?? body.error ?? 'Execution failed.'),
            },
          ])
        } else {
          setTranscript((prev) => [
            ...prev,
            {
              id: nextLineId(),
              role: 'jyson',
              text: body.error ?? `Execute failed (${res.status})`,
            },
          ])
          setOrbState('error')
        }
      } catch (err) {
        setTranscript((prev) => [
          ...prev,
          {
            id: nextLineId(),
            role: 'jyson',
            text: err instanceof Error ? err.message : 'Execute request failed',
          },
        ])
        setOrbState('error')
      } finally {
        setBusy(false)
        window.setTimeout(() => {
          setOrbState((s) => (s === 'success' || s === 'error' ? 'idle' : s))
          setStatusLine(undefined)
        }, 2400)
      }
    },
    [runtime]
  )

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || busy) return

    setInput('')
    setBusy(true)
    const nextTranscript: TranscriptLine[] = [
      ...transcript.slice(-8),
      { id: nextLineId(), role: 'user', text },
    ]
    setTranscript(nextTranscript)

    const route = routeCompanionCommand(text)

    if (route.kind === 'clarify') {
      setTranscript((prev) => [...prev, { id: nextLineId(), role: 'jyson', text: route.message }])
      setOrbState('idle')
      setBusy(false)
      return
    }

    if (route.kind === 'execute') {
      await runExecute(route.toolId, route.params, route.intent)
      return
    }

    await runChat(text, nextTranscript)
    setBusy(false)
  }, [input, busy, transcript, runChat, runExecute])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void handleSend()
  }

  return (
    <section className="jyson-companion-command" id="jyson">

      {/* Orb — hero visual, leads the page */}
      <JysonOrb state={orbState} statusLine={statusLine} />

      {/* Command input */}
      <form className="jyson-command-box" onSubmit={onSubmit}>
        <textarea
          ref={inputRef}
          className="jyson-command-box-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setOrbState('listening')}
          onBlur={() => { if (!busy) setOrbState('idle') }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void handleSend()
            }
          }}
          placeholder="Ask JYSON or give a command..."
          rows={2}
          disabled={busy}
          aria-label="Ask JYSON or give a command"
        />
        <button
          type="submit"
          className="jyson-command-box-submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
        >
          {busy ? '·' : '↑'}
        </button>
      </form>

      <p className="jyson-command-box-hint">
        Try: show me the docs folder &middot; read package.json &middot; or just ask anything
      </p>

      {/* Status pills — below the input, not above the orb */}
      <div className="jyson-companion-command-meta">
        <span className="jyson-chat-handle">{handle}</span>
        <span className={`jyson-chat-status ${cloudReady ? 'ok' : 'pending'}`}>
          {cloudReady ? 'Cloud' : 'Cloud offline'}
        </span>
        <span className={`jyson-chat-status ${localConnected ? 'ok' : 'pending'}`}>
          {localConnected ? 'Local' : 'Local offline'}
        </span>
        {runtime && (
          <span className={`jyson-chat-status ${runtime.localToolsAvailable ? 'ok' : 'pending'}`}>
            {runtime.localToolsAvailable ? 'Tools live' : 'Tools offline'}
          </span>
        )}
      </div>

      {/* Transcript */}
      {transcript.length > 1 && (
        <ul className="jyson-command-transcript" aria-label="Recent messages">
          {transcript.slice(-4).map((line) => (
            <li
              key={line.id}
              className={`jyson-command-transcript-line jyson-command-transcript-line--${line.role}`}
            >
              <span className="jyson-command-transcript-role">
                {line.role === 'user' ? 'You' : 'JYSON'}
              </span>
              <span>{line.text}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Tool result card */}
      <div ref={resultRef} className="jyson-command-result">
        {lastCard && (
          <JysonRuntimeCard
            card={lastCard.card}
            apiSuccess={lastCard.apiSuccess}
            compact
          />
        )}
      </div>

    </section>
  )
}
