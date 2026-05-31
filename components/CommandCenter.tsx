'use client'

import { useEffect, useRef, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import CommandOutput from './CommandOutput'

const ACTIVATION = [
  { text: '> verifying identity...', delay: 200 },
  { text: '✓ verified', delay: 900, success: true },
  { text: '', delay: 1000 },
  { text: '> establishing presence...', delay: 1100 },
  { text: '✓ presence active', delay: 1800, success: true },
  { text: '', delay: 1900 },
  { text: '> granting access...', delay: 2000 },
  { text: '✓ access enabled', delay: 2700, success: true },
  { text: '', delay: 2800 },
  { text: '> loading ecosystem...', delay: 2900 },
  { text: '✓ available', delay: 3600, success: true },
]

const AVAILABLE_COMMANDS = [
  '/systems', '/blueprints', '/frameworks', '/tools',
  '/future', '/worlds', '/connect-ai', '/view-stack', '/help', '/logout',
]

type HistoryItem =
  | { type: 'input'; text: string }
  | { type: 'output'; command: string }
  | { type: 'error'; text: string }

export default function CommandCenter() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [phase, setPhase] = useState<'activating' | 'active'>('activating')
  const [activationLines, setActivationLines] = useState<typeof ACTIVATION>([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [cmdIdx, setCmdIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Activation sequence
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    ACTIVATION.forEach((item, i) => {
      timers.push(
        setTimeout(() => {
          setActivationLines((prev) => [...prev, item])
        }, item.delay)
      )
    })
    timers.push(setTimeout(() => setPhase('active'), 4200))
    return () => timers.forEach(clearTimeout)
  }, [])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [activationLines, history, phase])

  // Focus input when active
  useEffect(() => {
    if (phase === 'active') setTimeout(() => inputRef.current?.focus(), 100)
  }, [phase])

  const handleCommand = (raw: string) => {
    const cmd = raw.trim().toLowerCase()
    if (!cmd) return

    setCmdHistory((prev) => [cmd, ...prev])
    setCmdIdx(-1)
    setHistory((prev) => [...prev, { type: 'input', text: cmd }])

    if (cmd === '/logout') {
      signOut()
      return
    }

    if (AVAILABLE_COMMANDS.includes(cmd)) {
      setHistory((prev) => [...prev, { type: 'output', command: cmd }])
    } else {
      setHistory((prev) => [
        ...prev,
        { type: 'error', text: `command not found: ${cmd}  |  type /help for available commands` },
      ])
    }
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand(input)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(cmdIdx + 1, cmdHistory.length - 1)
      setCmdIdx(next)
      setInput(cmdHistory[next] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = cmdIdx - 1
      if (next < 0) { setCmdIdx(-1); setInput('') }
      else { setCmdIdx(next); setInput(cmdHistory[next]) }
    }
  }

  const name = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Builder'
  const provider = user?.externalAccounts?.[0]?.provider?.replace('oauth_', '') || 'email'

  return (
    <div
      className="h-full flex flex-col"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header bar */}
      <div
        className="flex-none flex items-center justify-between px-6 py-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <div className="flex items-center gap-4">
          <span className="text-sm tracking-[0.25em]" style={{ color: 'var(--accent)' }}>
            ACCESS
          </span>
          {phase === 'active' && (
            <span className="text-[10px] tracking-widest" style={{ color: 'var(--text-muted)' }}>
              // NODE ACTIVE
            </span>
          )}
        </div>
        {phase === 'active' && (
          <div className="flex items-center gap-6 text-[10px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
            <span>
              <span style={{ color: 'var(--text-dim)' }}>identity</span>
              {'  '}
              <span style={{ color: 'var(--text)' }}>{name}</span>
            </span>
            <span>
              <span style={{ color: 'var(--text-dim)' }}>provider</span>
              {'  '}
              <span style={{ color: 'var(--text)' }}>{provider}</span>
            </span>
            <span>
              <span style={{ color: 'var(--success)' }}>●</span>
              {'  '}connected
            </span>
          </div>
        )}
      </div>

      {/* Scrollable terminal body */}
      <div
        id="terminal-scroll"
        ref={scrollRef}
        className="flex-1 px-6 py-6 font-mono text-sm"
        style={{ fontSize: '0.82rem', lineHeight: '1.8' }}
      >
        {/* Activation sequence */}
        {activationLines.map((line, i) => (
          <div key={i} className="fade-in">
            {line.text === '' ? (
              <div className="h-2" />
            ) : (
              <div style={{ color: line.success ? 'var(--success)' : 'var(--text-dim)' }}>
                {line.text}
              </div>
            )}
          </div>
        ))}

        {/* Post-activation welcome */}
        {phase === 'active' && (
          <div className="fade-in mt-6">
            <div className="mb-5" style={{ borderTop: '1px solid var(--border)' }} />

            {/* Identity block */}
            <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-1 max-w-sm text-xs" style={{ color: 'var(--text-dim)' }}>
              {[
                ['Identity', name],
                ['Provider', provider],
                ['Presence', 'Active'],
                ['Access Level', 'Builder'],
                ['Status', 'Connected'],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <span className="tracking-widest uppercase text-[10px]" style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ color: v === 'Active' || v === 'Connected' ? 'var(--success)' : 'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="mb-1" style={{ color: 'var(--text)' }}>Welcome.</div>
            <div className="mb-1" style={{ color: 'var(--text-dim)' }}>Access has been granted.</div>
            <div className="mb-6" style={{ color: 'var(--text-dim)' }}>What would you like to explore?</div>

            <div className="mb-6 text-xs" style={{ color: 'var(--text-muted)' }}>
              {AVAILABLE_COMMANDS.map((c, i) => (
                <span key={c}>
                  <button
                    className="hover:underline"
                    style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
                    onClick={(e) => { e.stopPropagation(); handleCommand(c) }}
                  >
                    {c}
                  </button>
                  {i < AVAILABLE_COMMANDS.length - 1 && <span style={{ color: 'var(--text-muted)' }}>{'  '}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Command history */}
        {history.map((item, i) => (
          <div key={i} className="fade-in">
            {item.type === 'input' && (
              <div className="mt-4 mb-1">
                <span style={{ color: 'var(--accent)' }}>&gt;&nbsp;</span>
                <span style={{ color: 'var(--text)' }}>{item.text}</span>
              </div>
            )}
            {item.type === 'output' && (
              <div className="mb-6">
                <CommandOutput command={(item as { type: 'output'; command: string }).command} />
              </div>
            )}
            {item.type === 'error' && (
              <div className="mb-4 text-xs" style={{ color: 'rgba(200,106,106,0.7)' }}>
                {(item as { type: 'error'; text: string }).text}
              </div>
            )}
          </div>
        ))}

        {/* Input prompt */}
        {phase === 'active' && (
          <div className="flex items-center mt-2">
            <span style={{ color: 'var(--accent)' }}>&gt;&nbsp;</span>
            <input
              ref={inputRef}
              className="cmd-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
              aria-label="terminal input"
            />
          </div>
        )}
      </div>
    </div>
  )
}
