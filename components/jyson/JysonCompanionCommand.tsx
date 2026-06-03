'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { routeCompanionCommand } from '@/lib/jyson-bridge/companion-command-router'
import type { OpenJarvisRuntimeCard } from '@/lib/openjarvis-bridge/runtime-card'
import type { OpenJarvisRuntimeState } from '@/lib/openjarvis/resolve-runtime-state'
import {
  PlanetPresence,
  type PlanetState,
  CommandInput,
  ConnectionStatus,
  IntelligenceAnswer,
  RuntimeCard,
  sectionsFromMessage,
  type IntelligenceSection,
  ACCESS_PENDING_PROMPT_KEY,
} from '@/lib/design-system/components/platform'
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
  const [orbState, setOrbState] = useState<PlanetState>('idle')
  const [intelligence, setIntelligence] = useState<IntelligenceSection | null>(null)
  const [statusLine, setStatusLine] = useState<string | undefined>()
  const [transcript, setTranscript] = useState<TranscriptLine[]>([
    {
      id: nextLineId(),
      role: 'jyson',
      text: 'Ask what to focus on next, or describe what you want to understand in your world.',
    },
  ])
  const [runtime, setRuntime] = useState<OpenJarvisRuntimeState | null>(null)
  const [lastCard, setLastCard] = useState<{
    card: OpenJarvisRuntimeCard
    apiSuccess: boolean
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

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
    try {
      const pending = sessionStorage.getItem(ACCESS_PENDING_PROMPT_KEY)
      if (!pending?.trim()) return
      sessionStorage.removeItem(ACCESS_PENDING_PROMPT_KEY)
      setInput(pending.trim())
      setOrbState('listening')
    } catch {
      /* ignore */
    }
  }, [])

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
        const reply = accumulated || '…'
        setTranscript((prev) => [...prev, { id: nextLineId(), role: 'jyson', text: reply }])
        setIntelligence(sectionsFromMessage(reply))
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
          setIntelligence({
            situation: ok ? intent : 'Local tool execution did not complete.',
            diagnosis: card.error ?? body.error ?? card.permission.reason,
            recommendation: ok
              ? 'Review the technical output below or run another command.'
              : 'Check connector, OpenJarvis, and path permissions.',
            nextAction: ok ? 'Ask a follow-up or open Advanced tools.' : 'Run connector heartbeat and retry.',
          })
          setTranscript((prev) => [
            ...prev,
            {
              id: nextLineId(),
              role: 'jyson',
              text: ok ? `Done — ${intent}.` : (card.error ?? 'Execution failed.'),
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
      setIntelligence(sectionsFromMessage(route.message))
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

  return (
    <section className="access-companion-console" id="jyson">
      <div className="access-companion-console__status">
        <span className="access-platform-meta">{handle}</span>
        <ConnectionStatus label="Cloud" online={cloudReady} />
        <ConnectionStatus label="Local OS" online={localConnected} />
        {runtime ? (
          <ConnectionStatus label="Tools" online={runtime.localToolsAvailable} />
        ) : null}
      </div>

      <PlanetPresence state={orbState} statusLine={statusLine} />

      <CommandInput
        value={input}
        onChange={setInput}
        onSubmit={() => void handleSend()}
        busy={busy}
        disabled={busy}
        onFocus={() => setOrbState('listening')}
        onBlur={() => {
          if (!busy) setOrbState('idle')
        }}
      />

      <p className="access-platform-meta access-companion-console__hint">
        What should I focus on next? · Summarize my products · What&apos;s in my registry?
      </p>

      {intelligence ? (
        <IntelligenceAnswer
          title="JYSON"
          sections={intelligence}
          technical={
            lastCard ? (
              <RuntimeCard title="Runtime output">
                <JysonRuntimeCard
                  card={lastCard.card}
                  apiSuccess={lastCard.apiSuccess}
                  compact
                />
              </RuntimeCard>
            ) : null
          }
        />
      ) : null}

      <div ref={resultRef} className="access-companion-console__result">
        {lastCard && !intelligence ? (
          <JysonRuntimeCard card={lastCard.card} apiSuccess={lastCard.apiSuccess} compact />
        ) : null}
      </div>
    </section>
  )
}
