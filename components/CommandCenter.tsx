'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import CommandOutput from './CommandOutput'
import BlueprintDisplay, { FlowType, FLOW_TYPE_LABELS, generateBlueprintText } from './access/BlueprintDisplay'
import AccessIdCard from './access/AccessIdCard'

/* ─── Activation sequence ─────────────────────────────────── */
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

/* ─── Blueprint flow definitions ──────────────────────────── */
interface FlowDef {
  label: string
  intro: string
  questions: string[]
  answerLabels: string[]
}

const FLOW_DEFS: Record<FlowType, FlowDef> = {
  ai: {
    label: 'BUILD YOUR FIRST AI SYSTEM',
    intro: 'An AI system is more than a chatbot. It needs purpose, interface, intelligence, memory, tools, and access.',
    questions: [
      'What do you want your AI system to help you do?',
      'Who will use this system?',
      'What are the main tasks it should handle?',
      'How should users interact with it? (website, app, terminal, voice, or internal dashboard)',
      'What tools should it eventually connect to? (email, files, calendar, notes, social media, code, or APIs)',
    ],
    answerLabels: ['purpose', 'audience', 'main tasks', 'interface', 'tools'],
  },
  business: {
    label: 'BUILD YOUR BUSINESS SYSTEM',
    intro: 'A business system connects your offer, your audience, and your delivery into one operating architecture.',
    questions: [
      'What business or offer are you trying to build?',
      'Who is the target customer?',
      'What result do you help them get?',
      'How will you sell or deliver it?',
      'What part of the business should AI help with first?',
    ],
    answerLabels: ['business idea', 'target customer', 'core outcome', 'offer structure', 'AI support area'],
  },
  content: {
    label: 'BUILD YOUR CONTENT SYSTEM',
    intro: 'A content system turns your ideas into consistent, scalable output. It should run with or without you.',
    questions: [
      'What message or topic do you want to create content around?',
      'Who are you trying to reach?',
      'What platforms do you want to use?',
      'What kind of content do you want to make?',
      'What do you want the content to lead people toward?',
    ],
    answerLabels: ['message', 'audience', 'platforms', 'content formats', 'conversion goal'],
  },
  knowledge: {
    label: 'BUILD YOUR KNOWLEDGE SYSTEM',
    intro: 'A knowledge system turns everything you learn into something you can use. It compounds over time.',
    questions: [
      'What knowledge do you want to organize?',
      'What are you trying to remember, build, or study?',
      'Where is your knowledge currently stored?',
      'How do you want AI to use this knowledge?',
      'What output should this system help create?',
    ],
    answerLabels: ['knowledge area', 'purpose', 'current storage', 'AI use case', 'desired output'],
  },
}

/* ─── Commands ─────────────────────────────────────────────── */
const AVAILABLE_COMMANDS = [
  '/start', '/presence', '/pathways',
  '/build-ai-system', '/build-business', '/build-content-system', '/build-knowledge-system',
  '/explore', '/my-id',
  '/jd-ecosystem', '/systems', '/systems-registry', '/blueprints',
  '/frameworks', '/tools', '/capabilities',
  '/connect-ai', '/access-id', '/network', '/worlds', '/view-stack',
  '/save-blueprint', '/export-blueprint', '/copy-blueprint', '/email-blueprint', '/start-over',
  '/my-blueprints', '/open-blueprint', '/delete-blueprint',
  '/help', '/logout',
]

const SUGGESTIONS: Record<string, string[]> = {
  'who':      ['/presence', '/my-id'],
  'what':     ['/start', '/jd-ecosystem'],
  'build':    ['/build-ai-system', '/build-business', '/build-content-system'],
  'ai':       ['/build-ai-system', '/systems-registry', '/connect-ai'],
  'connect':  ['/connect-ai', '/network'],
  'future':   ['/network', '/capabilities', '/pathways'],
  'system':   ['/systems', '/systems-registry', '/view-stack'],
  'plan':     ['/blueprints', '/build-ai-system'],
  'help':     ['/help'],
  'path':     ['/pathways', '/start'],
  'identity': ['/presence', '/my-id'],
  'network':  ['/network', '/connect-ai'],
  'blueprint':['/my-blueprints', '/blueprints'],
  'save':     ['/save-blueprint', '/my-blueprints'],
  'explore':  ['/explore', '/start'],
  'knowledge':['/build-knowledge-system', '/blueprints'],
}

function getSuggestions(cmd: string): string[] {
  const lower = cmd.replace(/^\//, '')
  for (const [key, cmds] of Object.entries(SUGGESTIONS)) {
    if (lower.includes(key)) return cmds
  }
  return ['/start', '/help']
}

const NUMBER_MAP: Record<string, string> = {
  '1': '/build-ai-system',
  '2': '/build-business',
  '3': '/build-content-system',
  '4': '/build-knowledge-system',
  '5': '/explore',
}

/* ─── History types ────────────────────────────────────────── */
type FlowState = { type: FlowType; step: number; answers: string[] }

type SavedBlueprint = { id: string; type: FlowType; label: string; date: string; answers: string[] }

type HistoryItem =
  | { type: 'input'; text: string }
  | { type: 'output'; command: string }
  | { type: 'error'; text: string }
  | { type: 'question'; text: string; qNum: number; total: number; label: string }
  | { type: 'flow-intro'; flowType: FlowType }
  | { type: 'blueprint'; flowType: FlowType; answers: string[]; id: string }
  | { type: 'info'; text: string; success?: boolean }
  | { type: 'id-card' }
  | { type: 'blueprint-list'; blueprints: SavedBlueprint[] }

/* ─── ACCESS ID derivation ─────────────────────────────────── */
function deriveUsername(user: ReturnType<typeof useUser>['user']): string {
  if (!user) return 'guest-builder'
  // Priority: GitHub username → Clerk username → email prefix → full name slug → guest-builder
  const github = user.externalAccounts?.find(a => (a.provider as string) === 'oauth_github')
  if (github?.username) return github.username.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (user.username) return user.username.toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const email = user.emailAddresses?.[0]?.emailAddress
  if (email) return email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const name = user.fullName
  if (name) return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  return 'guest-builder'
}

function toAccessId(username: string): string {
  return `${username.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')}.access`
}

const LS_KEY = 'access_blueprints'

function loadBlueprints(): SavedBlueprint[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')
  } catch { return [] }
}
function saveBlueprints(list: SavedBlueprint[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

/* ─── Component ─────────────────────────────────────────────── */
export default function CommandCenter() {
  const { user } = useUser()
  const { signOut } = useClerk()

  const [phase, setPhase] = useState<'activating' | 'active'>('activating')
  const [activationLines, setActivationLines] = useState<typeof ACTIVATION>([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [cmdHistory, setCmdHistory] = useState<string[]>([])
  const [cmdIdx, setCmdIdx] = useState(-1)
  const [flow, setFlow] = useState<FlowState | null>(null)
  const [lastBlueprint, setLastBlueprint] = useState<{ flowType: FlowType; answers: string[]; id: string } | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const username = deriveUsername(user)
  const accessId = toAccessId(username)
  const displayName = user?.firstName || user?.username || username

  // Activation sequence
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    ACTIVATION.forEach(item => {
      timers.push(setTimeout(() => setActivationLines(prev => [...prev, item]), item.delay))
    })
    timers.push(setTimeout(() => setPhase('active'), 4200))
    return () => timers.forEach(clearTimeout)
  }, [])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [activationLines, history, phase])

  // Focus input
  useEffect(() => {
    if (phase === 'active') setTimeout(() => inputRef.current?.focus(), 100)
  }, [phase])

  /* ─── Blueprint action handlers ────────────────────────── */
  const handleSaveBlueprint = useCallback((bp: { flowType: FlowType; answers: string[]; id: string }) => {
    const list = loadBlueprints()
    if (list.find(b => b.id === bp.id)) return
    const entry: SavedBlueprint = {
      id: bp.id,
      type: bp.flowType,
      label: FLOW_TYPE_LABELS[bp.flowType],
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      answers: bp.answers,
    }
    saveBlueprints([entry, ...list])
    setSavedIds(prev => new Set([...prev, bp.id]))
  }, [])

  const handleCopyBlueprint = useCallback((bp: { flowType: FlowType; answers: string[]; id: string }) => {
    const text = generateBlueprintText(bp.flowType, bp.answers, username)
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedId(bp.id)
    setTimeout(() => setCopiedId(null), 2500)
  }, [username])

  const handleExportBlueprint = useCallback((bp: { flowType: FlowType; answers: string[]; id: string }) => {
    const text = generateBlueprintText(bp.flowType, bp.answers, username)
    const date = new Date().toISOString().slice(0, 10)
    const filename = `access-blueprint-${bp.flowType}-${date}.md`
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }, [username])

  /* ─── Command handler ───────────────────────────────────── */
  const handleCommand = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return

    // If inside a Q&A flow, treat input as an answer
    if (flow !== null) {
      const def = FLOW_DEFS[flow.type]
      const newAnswers = [...flow.answers, trimmed]

      setCmdHistory(prev => [trimmed, ...prev])
      setCmdIdx(-1)

      if (flow.step < def.questions.length - 1) {
        const nextStep = flow.step + 1
        setFlow({ ...flow, step: nextStep, answers: newAnswers })
        setHistory(prev => [
          ...prev,
          { type: 'input', text: trimmed },
          {
            type: 'question',
            text: def.questions[nextStep],
            qNum: nextStep + 1,
            total: def.questions.length,
            label: def.answerLabels[nextStep],
          },
        ])
      } else {
        // All questions answered — generate blueprint
        const id = `${flow.type}-${Date.now()}`
        const bp = { flowType: flow.type, answers: newAnswers, id }
        setLastBlueprint(bp)
        setFlow(null)
        setHistory(prev => [
          ...prev,
          { type: 'input', text: trimmed },
          { type: 'blueprint', flowType: bp.flowType, answers: bp.answers, id: bp.id },
        ])
      }
      setInput('')
      return
    }

    let cmd = trimmed.toLowerCase()
    if (NUMBER_MAP[cmd]) cmd = NUMBER_MAP[cmd]

    setCmdHistory(prev => [cmd, ...prev])
    setCmdIdx(-1)
    setHistory(prev => [...prev, { type: 'input', text: cmd }])

    // ── Session ──
    if (cmd === '/logout') { signOut(); return }

    // ── Blueprint flow starters ──
    if (cmd === '/build-ai-system' || cmd === '/build-business' || cmd === '/build-content-system' || cmd === '/build-knowledge-system') {
      const flowMap: Record<string, FlowType> = {
        '/build-ai-system': 'ai',
        '/build-business': 'business',
        '/build-content-system': 'content',
        '/build-knowledge-system': 'knowledge',
      }
      const ft = flowMap[cmd]
      const def = FLOW_DEFS[ft]
      setFlow({ type: ft, step: 0, answers: [] })
      setHistory(prev => [
        ...prev,
        { type: 'flow-intro', flowType: ft },
        { type: 'question', text: def.questions[0], qNum: 1, total: def.questions.length, label: def.answerLabels[0] },
      ])
      setInput('')
      return
    }

    // ── Blueprint actions ──
    if (cmd === '/save-blueprint') {
      if (!lastBlueprint) {
        setHistory(prev => [...prev, { type: 'info', text: 'No blueprint active. Generate one first with /build-ai-system or /start.' }])
      } else {
        handleSaveBlueprint(lastBlueprint)
        setHistory(prev => [...prev, { type: 'info', text: '✓ Blueprint saved to your ACCESS workspace.', success: true }])
      }
      setInput('')
      return
    }
    if (cmd === '/copy-blueprint') {
      if (!lastBlueprint) {
        setHistory(prev => [...prev, { type: 'info', text: 'No blueprint active. Generate one first.' }])
      } else {
        handleCopyBlueprint(lastBlueprint)
        setHistory(prev => [...prev, { type: 'info', text: '✓ Blueprint copied to clipboard.', success: true }])
      }
      setInput('')
      return
    }
    if (cmd === '/export-blueprint') {
      if (!lastBlueprint) {
        setHistory(prev => [...prev, { type: 'info', text: 'No blueprint active. Generate one first.' }])
      } else {
        handleExportBlueprint(lastBlueprint)
        setHistory(prev => [...prev, { type: 'info', text: '✓ Blueprint exported as .md file.', success: true }])
      }
      setInput('')
      return
    }
    if (cmd === '/email-blueprint') {
      setHistory(prev => [...prev, { type: 'info', text: 'Email export is coming soon. For now, use /export-blueprint or /copy-blueprint.' }])
      setInput('')
      return
    }
    if (cmd === '/start-over') {
      setFlow(null)
      setLastBlueprint(null)
      setHistory(prev => [...prev, { type: 'output', command: '/start' }])
      setInput('')
      return
    }

    // ── My blueprints ──
    if (cmd === '/my-blueprints') {
      const list = loadBlueprints()
      setHistory(prev => [...prev, { type: 'blueprint-list', blueprints: list }])
      setInput('')
      return
    }
    if (cmd.startsWith('/open-blueprint ')) {
      const idx = parseInt(cmd.replace('/open-blueprint ', ''), 10) - 1
      const list = loadBlueprints()
      const bp = list[idx]
      if (!bp) {
        setHistory(prev => [...prev, { type: 'info', text: `Blueprint ${idx + 1} not found. Type /my-blueprints to see your list.` }])
      } else {
        const id = `${bp.type}-open-${Date.now()}`
        const bpObj = { flowType: bp.type, answers: bp.answers, id }
        setLastBlueprint(bpObj)
        setHistory(prev => [...prev, { type: 'blueprint', flowType: bp.type, answers: bp.answers, id }])
      }
      setInput('')
      return
    }
    if (cmd.startsWith('/delete-blueprint ')) {
      const idx = parseInt(cmd.replace('/delete-blueprint ', ''), 10) - 1
      const list = loadBlueprints()
      if (!list[idx]) {
        setHistory(prev => [...prev, { type: 'info', text: `Blueprint ${idx + 1} not found.` }])
      } else {
        const removed = list[idx]
        saveBlueprints(list.filter((_, i) => i !== idx))
        setHistory(prev => [...prev, { type: 'info', text: `✓ Deleted: ${removed.label} Blueprint`, success: true }])
      }
      setInput('')
      return
    }

    // ── Identity card ──
    if (cmd === '/my-id') {
      setHistory(prev => [...prev, { type: 'id-card' }])
      setInput('')
      return
    }

    // ── Standard commands ──
    if (AVAILABLE_COMMANDS.includes(cmd)) {
      setHistory(prev => [...prev, { type: 'output', command: cmd }])
    } else {
      const suggestions = getSuggestions(cmd)
      setHistory(prev => [
        ...prev,
        { type: 'error', text: `command not found: ${cmd}  —  try: ${suggestions.join('  ')}` },
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

  return (
    <div className="h-full flex flex-col" onClick={() => inputRef.current?.focus()}>

      {/* Header */}
      <div className="flex-none flex items-center justify-between px-6 py-3"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-4">
          <span className="text-sm tracking-[0.25em]" style={{ color: 'var(--accent)' }}>ACCESS</span>
          {phase === 'active' && (
            <span className="text-[10px] tracking-widest" style={{ color: 'var(--text-muted)' }}>
              // NODE ACTIVE
            </span>
          )}
        </div>
        {phase === 'active' && (
          <div className="flex items-center gap-6 text-[10px] tracking-wider" style={{ color: 'var(--text-muted)' }}>
            <span>
              <span style={{ color: 'var(--text-dim)' }}>id</span>{'  '}
              <span style={{ color: 'var(--accent)' }}>{accessId}</span>
            </span>
            <span>
              <span style={{ color: 'var(--success)' }}>●</span>{'  '}connected
            </span>
          </div>
        )}
      </div>

      {/* Terminal body */}
      <div id="terminal-scroll" ref={scrollRef} className="flex-1 px-6 py-6 font-mono text-sm"
        style={{ fontSize: '0.82rem', lineHeight: '1.8', overflowY: 'auto' }}>

        {/* Activation sequence */}
        {activationLines.map((line, i) => (
          <div key={i} className="fade-in">
            {line.text === '' ? <div className="h-2" /> : (
              <div style={{ color: line.success ? 'var(--success)' : 'var(--text-dim)' }}>{line.text}</div>
            )}
          </div>
        ))}

        {/* Post-activation welcome */}
        {phase === 'active' && (
          <div className="fade-in mt-6">
            <div className="mb-5" style={{ borderTop: '1px solid var(--border)' }} />

            <div style={{ marginBottom: '6px', color: 'var(--text)', fontSize: '0.92rem', fontWeight: 300, letterSpacing: '0.04em' }}>
              Welcome, {displayName}.
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', lineHeight: '1.7', marginBottom: '14px' }}>
              Your presence is active. Your ACCESS ID has been created.
            </div>

            {/* ACCESS ID prominent display */}
            <div style={{
              display: 'inline-block',
              background: 'rgba(64,192,208,0.04)',
              border: '1px solid rgba(64,192,208,0.15)',
              borderRadius: '2px',
              padding: '10px 18px',
              marginBottom: '24px',
            }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '5px' }}>
                ACCESS ID
              </div>
              <div style={{ fontSize: '16px', color: 'var(--accent)', letterSpacing: '0.06em', fontWeight: 300 }}>
                {accessId}
              </div>
            </div>

            <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginBottom: '16px' }}>
              What are you here to build?
            </div>

            {/* Path selectors */}
            <div style={{ marginBottom: '28px' }}>
              {[
                ['1', 'My first AI system',          '/build-ai-system'],
                ['2', 'My business system',           '/build-business'],
                ['3', 'My content system',            '/build-content-system'],
                ['4', 'My personal knowledge system', '/build-knowledge-system'],
                ['5', 'I just want to explore',       '/explore'],
              ].map(([n, label, cmd]) => (
                <button
                  key={n}
                  onClick={e => { e.stopPropagation(); handleCommand(n) }}
                  style={{
                    display: 'flex', gap: '20px', width: '100%', maxWidth: '520px',
                    alignItems: 'center', padding: '10px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    borderTop: n === '1' ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                  onMouseEnter={e => {
                    const num = e.currentTarget.querySelector('.path-num') as HTMLElement
                    if (num) num.style.color = 'var(--accent)'
                  }}
                  onMouseLeave={e => {
                    const num = e.currentTarget.querySelector('.path-num') as HTMLElement
                    if (num) num.style.color = 'var(--text-muted)'
                  }}
                >
                  <span className="path-num" style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: '12px', width: '16px', flexShrink: 0, transition: 'color 0.12s' }}>{n}</span>
                  <span style={{ color: 'var(--text)', fontSize: '13px', flex: 1 }}>{label}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.08em' }}>{cmd}</span>
                </button>
              ))}
            </div>

            {/* Quick commands */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px', maxWidth: '600px', marginBottom: '16px' }}>
              {[
                ['/my-id',           'Your ACCESS identity'],
                ['/blueprints',      'View blueprints'],
                ['/my-blueprints',   'Saved blueprints'],
                ['/systems-registry','What AI systems look like'],
                ['/tools',           'Tools in the ecosystem'],
                ['/network',         'Future network vision'],
                ['/help',            'All commands'],
              ].map(([cmd, label]) => (
                <button key={cmd}
                  onClick={e => { e.stopPropagation(); handleCommand(cmd) }}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '2px', padding: '8px 12px', textAlign: 'left',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(64,192,208,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ color: 'var(--accent)', fontSize: '10px', letterSpacing: '0.1em', marginBottom: '2px' }}>{cmd}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History */}
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
                <CommandOutput command={item.command} userName={username} />
              </div>
            )}

            {item.type === 'error' && (
              <div className="mb-4 text-xs" style={{ color: 'rgba(200,106,106,0.7)' }}>
                {item.text}
              </div>
            )}

            {item.type === 'flow-intro' && (
              <div className="mb-2" style={{
                padding: '16px 20px',
                borderLeft: '2px solid rgba(64,192,208,0.3)',
                background: 'rgba(64,192,208,0.02)',
                marginTop: '8px',
              }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '8px' }}>
                  {FLOW_DEFS[item.flowType].label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.7' }}>
                  {FLOW_DEFS[item.flowType].intro}
                </div>
              </div>
            )}

            {item.type === 'question' && (
              <div className="mb-2 mt-4" style={{ paddingLeft: '2px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.16em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Question {item.qNum} of {item.total}
                  <span style={{ color: 'rgba(64,192,208,0.4)', marginLeft: '10px' }}>{item.label}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.65' }}>{item.text}</div>
              </div>
            )}

            {item.type === 'blueprint' && (
              <div className="mb-6 mt-4">
                <BlueprintDisplay
                  flowType={item.flowType}
                  answers={item.answers}
                  username={username}
                  savedState={savedIds.has(item.id) ? 'saved' : 'unsaved'}
                  copiedState={copiedId === item.id}
                  onSave={() => handleSaveBlueprint({ flowType: item.flowType, answers: item.answers, id: item.id })}
                  onCopy={() => handleCopyBlueprint({ flowType: item.flowType, answers: item.answers, id: item.id })}
                  onExport={() => handleExportBlueprint({ flowType: item.flowType, answers: item.answers, id: item.id })}
                  onStartOver={() => {
                    setFlow(null)
                    setHistory(prev => [...prev, { type: 'output', command: '/start' }])
                  }}
                />
              </div>
            )}

            {item.type === 'info' && (
              <div className="mb-3 text-xs" style={{ color: item.success ? 'var(--success)' : 'var(--text-dim)', paddingLeft: '2px' }}>
                {item.text}
              </div>
            )}

            {item.type === 'id-card' && (
              <div className="mb-6 mt-4">
                <AccessIdCard username={username} />
              </div>
            )}

            {item.type === 'blueprint-list' && (
              <div className="mb-6 mt-2">
                <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '14px' }}>
                  MY BLUEPRINTS
                </div>
                {item.blueprints.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    No saved blueprints yet. Generate one with /build-ai-system or /start.
                  </div>
                ) : (
                  <>
                    {item.blueprints.map((bp, idx) => (
                      <div key={bp.id} style={{ display: 'flex', gap: '16px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', width: '16px', flexShrink: 0 }}>{idx + 1}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ color: 'var(--text)', fontSize: '12px' }}>{bp.label} Blueprint</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: '12px' }}>{bp.date}</span>
                        </div>
                        <span style={{ color: 'var(--accent)', fontSize: '10px' }}>/open-blueprint {idx + 1}</span>
                      </div>
                    ))}
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '12px', lineHeight: '1.7' }}>
                      /open-blueprint [n]  to reopen  ·  /delete-blueprint [n]  to remove
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        ))}

        {/* Flow prompt indicator */}
        {phase === 'active' && flow && (
          <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px', marginBottom: '4px', letterSpacing: '0.08em' }}>
            answering question {flow.step + 1} of {FLOW_DEFS[flow.type].questions.length}
            <span style={{ color: 'rgba(64,192,208,0.4)', marginLeft: '10px' }}>type your answer and press enter</span>
          </div>
        )}

        {/* Input prompt */}
        {phase === 'active' && (
          <div className="flex items-center mt-2">
            <span style={{ color: 'var(--accent)' }}>&gt;&nbsp;</span>
            <input
              ref={inputRef}
              className="cmd-input"
              value={input}
              onChange={e => setInput(e.target.value)}
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
