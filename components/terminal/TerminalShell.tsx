'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import AccessAppLayout from '@/components/navigation/AccessAppLayout'
import { dispatchJysonCommand } from '@/lib/actions/jyson-dispatch'

type OutputLine = {
  id: number
  type: 'input' | 'output' | 'error' | 'system'
  text: string
  meta?: string
}

const BOOT_LINES: OutputLine[] = [
  { id: 0, type: 'system', text: 'ACCESS OS Terminal v1.0' },
  { id: 1, type: 'system', text: 'Connected to JYSON intent router.' },
  { id: 2, type: 'system', text: 'Type a command or describe what you want to do.' },
  { id: 3, type: 'system', text: '──────────────────────────────────────────────' },
]

let _id = 4

function nextId() {
  return _id++
}

export default function TerminalShell() {
  const { isLoaded, isSignedIn } = useAuth()
  const [lines, setLines] = useState<OutputLine[]>(BOOT_LINES)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines])

  const push = useCallback((line: Omit<OutputLine, 'id'>) => {
    setLines((prev) => [...prev, { ...line, id: nextId() }])
  }, [])

  const run = useCallback(
    async (raw: string) => {
      const cmd = raw.trim()
      if (!cmd) return

      push({ type: 'input', text: `> ${cmd}` })
      setHistory((h) => [cmd, ...h].slice(0, 50))
      setHistoryIdx(-1)
      setInput('')
      setBusy(true)

      try {
        const result = await dispatchJysonCommand(cmd)

        if (result.error) {
          push({ type: 'error', text: result.error })
          return
        }

        const d = result.decision
        if (!d) {
          push({ type: 'error', text: 'No decision returned.' })
          return
        }

        push({ type: 'output', text: `Intent: ${d.intent}`, meta: `${Math.round(d.confidence * 100)}% confidence` })
        push({ type: 'output', text: `Route: ${d.destination}` })
        push({ type: d.allowed ? 'output' : 'error', text: `Access: ${d.allowed ? 'allowed' : 'denied'} — ${d.reason}` })
        push({ type: 'system', text: d.userMessage })
      } catch (e) {
        push({ type: 'error', text: e instanceof Error ? e.message : 'Command failed.' })
      } finally {
        setBusy(false)
        inputRef.current?.focus()
      }
    },
    [push]
  )

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(historyIdx + 1, history.length - 1)
      setHistoryIdx(next)
      setInput(history[next] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(historyIdx - 1, -1)
      setHistoryIdx(next)
      setInput(next === -1 ? '' : (history[next] ?? ''))
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!busy) void run(input)
  }

  if (!isLoaded) return null

  if (!isSignedIn) {
    return (
      <div className="terminal-shell terminal-shell--center">
        <p className="terminal-system">Sign in to access the terminal.</p>
      </div>
    )
  }

  return (
    <AccessAppLayout variant="default">
      <div className="terminal-shell">
        <header className="terminal-header">
          <span className="terminal-eyebrow">ACCESS OS</span>
          <span className="terminal-title">Terminal</span>
          <span className="terminal-badge">{busy ? 'processing…' : 'ready'}</span>
        </header>

        <div className="terminal-output" onClick={() => inputRef.current?.focus()}>
          {lines.map((line) => (
            <div key={line.id} className={`terminal-line terminal-line--${line.type}`}>
              <span className="terminal-line-text">{line.text}</span>
              {line.meta && <span className="terminal-line-meta">{line.meta}</span>}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form className="terminal-input-row" onSubmit={onSubmit}>
          <span className="terminal-prompt">{'>'}</span>
          <input
            ref={inputRef}
            className="terminal-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Enter a command…"
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
            autoFocus
          />
          <button
            type="submit"
            className="terminal-submit"
            disabled={busy || !input.trim()}
          >
            {busy ? '…' : '↵'}
          </button>
        </form>

        <p className="terminal-footnote">
          JYSON intent routing · P7 dispatch · ↑↓ command history · execution engine pending
        </p>
      </div>
    </AccessAppLayout>
  )
}
