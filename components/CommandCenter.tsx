'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import CommandOutput from './CommandOutput'
import BlueprintDisplay, { FlowType, FLOW_TYPE_LABELS, generateBlueprintText } from './access/BlueprintDisplay'
import AccessIdCard from './access/AccessIdCard'
import { getOrCreateIdentity } from '@/lib/actions/identity'
import { saveBlueprint, listBlueprints, deleteBlueprint as deleteBlueprintAction } from '@/lib/actions/blueprints'
import { createSystem, listSystems, getSystem, deleteSystem as deleteSystemAction } from '@/lib/actions/systems'
import { createBuilderProject, listBuilderProjects } from '@/lib/actions/projects'
import { createAgent, listAgents } from '@/lib/actions/agents'
import { createAsset, listAssets } from '@/lib/actions/assets'
import { createWorkflow, listWorkflows } from '@/lib/actions/workflows'
import { createVault, listVaults } from '@/lib/actions/vaults'
import { createOffer, listOffers } from '@/lib/actions/offers'
import { getRegistrySummary } from '@/lib/actions/registry'
import RegistryPanel from './access/RegistryPanel'
import type { Blueprint, System, BuilderProject, Task, Milestone, Agent, Asset, Workflow, Vault, Offer, RegistrySummary } from '@/types/db'

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
  '/registry',
  '/my-systems', '/register-system', '/open-system', '/system-status', '/delete-system',
  '/register-agent', '/my-agents',
  '/register-asset', '/my-assets',
  '/register-workflow', '/my-workflows',
  '/register-vault', '/my-vaults',
  '/register-offer', '/my-offers',
  '/my-projects', '/jd-ecosystem', '/systems', '/systems-registry', '/blueprints',
  '/frameworks', '/tools', '/capabilities',
  '/connect-ai', '/access-id', '/network', '/worlds', '/view-stack',
  '/save-blueprint', '/export-blueprint', '/copy-blueprint', '/email-blueprint', '/start-over',
  '/my-blueprints', '/open-blueprint', '/delete-blueprint',
  '/connect-jyson',
  '/help', '/logout',
]

const SUGGESTIONS: Record<string, string[]> = {
  'who':      ['/presence', '/my-id'],
  'what':     ['/start', '/jd-ecosystem'],
  'build':    ['/build-ai-system', '/build-business', '/build-content-system'],
  'ai':       ['/build-ai-system', '/systems-registry', '/connect-ai'],
  'connect':  ['/connect-ai', '/network'],
  'future':   ['/network', '/capabilities', '/pathways'],
  'system':   ['/my-systems', '/register-system', '/systems-registry'],
  'register': ['/register-system', '/my-systems'],
  'plan':     ['/blueprints', '/build-ai-system'],
  'help':     ['/help'],
  'path':     ['/pathways', '/start'],
  'identity': ['/presence', '/my-id'],
  'network':  ['/network', '/connect-ai'],
  'blueprint':['/my-blueprints', '/blueprints'],
  'project': ['/my-projects', '/register-system'],
  'workspace':['/my-projects'],
  'continue':['/my-projects'],
  'save':     ['/save-blueprint', '/my-blueprints'],
  'explore':  ['/explore', '/start'],
  'knowledge':['/build-knowledge-system', '/blueprints'],
  'delete':   ['/delete-system', '/delete-blueprint'],
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

/* ─── ACCESS ID derivation ─────────────────────────────────── */
function deriveUsername(user: ReturnType<typeof useUser>['user']): string {
  if (!user) return 'guest-builder'
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

function deriveSystemHandle(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+os\s*$/i, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    + '.access'
}

/* ─── JYSON handoff payload ─────────────────────────────────── */
interface JysonProjectData {
  name: string
  objective: string
  milestones: string[]
  tasks: string[]
  stack: string[]
}

interface JysonPayload {
  source: 'jyson'
  name: string
  type: FlowType
  architecture: string
  project?: JysonProjectData
}

function decodeJysonPayload(param: string): JysonPayload | null {
  try {
    const binary = atob(param)
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    const payload = JSON.parse(json) as JysonPayload
    if (payload.source === 'jyson' && payload.name && payload.architecture) return payload
  } catch {}
  return null
}

/* ─── Active flow types ─────────────────────────────────────── */
type BlueprintFlow = {
  kind: 'blueprint'
  type: FlowType
  step: number
  answers: string[]
}

type RegisterFlow = {
  kind: 'register'
  step: 'name' | 'confirm-id'
  blueprintType: FlowType | null
  blueprintAnswers: string[] | null
  blueprintDbId: string | null
  suggestedHandle: string | null
  name: string | null
}

export type RegistryObjectType = 'agent' | 'asset' | 'workflow' | 'vault' | 'offer'

type RegistryFlow = {
  kind: 'registry-object'
  objectType: RegistryObjectType
  step: number   // 0 = name, 1 = description/details
  name: string | null
}

type ActiveFlow = BlueprintFlow | RegisterFlow | RegistryFlow

const REGISTRY_FLOW_DEFS: Record<RegistryObjectType, { label: string; q1: string; q2: string }> = {
  agent:    { label: 'REGISTER AGENT',    q1: 'What is this agent called?',     q2: 'What does this agent do? (role and purpose)' },
  asset:    { label: 'REGISTER ASSET',    q1: 'What is this asset called?',     q2: 'Describe it — what type is it and what does it contain?' },
  workflow: { label: 'REGISTER WORKFLOW', q1: 'What is this workflow called?',  q2: 'What does this workflow automate?' },
  vault:    { label: 'REGISTER VAULT',    q1: 'What is this vault called?',     q2: 'What knowledge does it store?' },
  offer:    { label: 'REGISTER OFFER',    q1: 'What is this offer called?',     q2: 'What does it provide and how is it delivered?' },
}

/* ─── History types ────────────────────────────────────────── */
type HistoryItem =
  | { type: 'input'; text: string }
  | { type: 'output'; command: string }
  | { type: 'error'; text: string }
  | { type: 'question'; text: string; qNum: number; total: number; label: string }
  | { type: 'flow-intro'; flowType: FlowType }
  | { type: 'register-intro'; flowType: FlowType | null }
  | { type: 'register-confirm'; suggestedHandle: string; name: string }
  | { type: 'blueprint'; flowType: FlowType; answers: string[]; dbId: string | null }
  | { type: 'system-registered'; system: System }
  | { type: 'info'; text: string; success?: boolean }
  | { type: 'id-card'; systemCount: number }
  | { type: 'blueprint-list'; blueprints: Blueprint[] }
  | { type: 'system-list'; systems: System[] }
  | { type: 'system-detail'; system: System }
  | { type: 'processing'; text: string }
  | { type: 'jyson-handoff'; payload: JysonPayload }
  | { type: 'project-created'; project: BuilderProject }
  | { type: 'project-list'; projects: BuilderProject[] }
  | { type: 'registry-panel'; summary: RegistrySummary }
  | { type: 'registry-question'; objectType: RegistryObjectType; questionText: string; step: number }
  | { type: 'registry-registered'; objectType: RegistryObjectType; name: string }
  | { type: 'registry-list'; objectType: RegistryObjectType; items: Array<{ id: string; name: string; description: string | null; created_at: string }> }

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
  const [flow, setFlow] = useState<ActiveFlow | null>(null)
  const [lastBlueprint, setLastBlueprint] = useState<{ flowType: FlowType; answers: string[]; dbId: string | null } | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [systemCount, setSystemCount] = useState(0)
  const [jysonHandoff, setJysonHandoff] = useState<JysonPayload | null>(null)
  const [registrySummary, setRegistrySummary] = useState<RegistrySummary | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const username = deriveUsername(user)
  const accessId = toAccessId(username)
  const displayName = user?.firstName || user?.username || username

  /* ─── Activation ──────────────────────────────────────────── */
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    ACTIVATION.forEach(item => {
      timers.push(setTimeout(() => setActivationLines(prev => [...prev, item]), item.delay))
    })
    timers.push(setTimeout(() => setPhase('active'), 4200))
    return () => timers.forEach(clearTimeout)
  }, [])

  /* ─── Initialize identity in DB on first login ──────────────── */
  useEffect(() => {
    if (phase !== 'active') return
    getOrCreateIdentity(accessId).catch(() => null)
    listSystems().then(s => setSystemCount(s.length)).catch(() => null)
    getRegistrySummary(accessId).then(s => setRegistrySummary(s)).catch(() => null)

    // Check for JYSON handoff payload in URL
    const params = new URLSearchParams(window.location.search)
    const jysonParam = params.get('jyson')
    if (jysonParam) {
      const payload = decodeJysonPayload(jysonParam)
      if (payload) {
        setJysonHandoff(payload)
        window.history.replaceState({}, '', window.location.pathname)
        setTimeout(() => setHistory(prev => [...prev, { type: 'jyson-handoff', payload }]), 800)
      }
    }
  }, [phase, accessId])

  /* ─── Auto-scroll ─────────────────────────────────────────── */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [activationLines, history, phase])

  /* ─── Focus input ─────────────────────────────────────────── */
  useEffect(() => {
    if (phase === 'active') setTimeout(() => inputRef.current?.focus(), 100)
  }, [phase])

  /* ─── Blueprint action helpers ──────────────────────────────── */
  const handleCopyBlueprint = useCallback((bp: { flowType: FlowType; answers: string[] }) => {
    const key = `${bp.flowType}-${bp.answers[0]}`
    const text = generateBlueprintText(bp.flowType, bp.answers, username)
    navigator.clipboard.writeText(text).catch(() => {})
    setCopiedId(key)
    setTimeout(() => setCopiedId(null), 2500)
  }, [username])

  const handleExportBlueprint = useCallback((bp: { flowType: FlowType; answers: string[] }) => {
    const text = generateBlueprintText(bp.flowType, bp.answers, username)
    const date = new Date().toISOString().slice(0, 10)
    const blob = new Blob([text], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `access-blueprint-${bp.flowType}-${date}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [username])

  /* ─── Command handler ───────────────────────────────────────── */
  const push = useCallback((item: HistoryItem) => {
    setHistory(prev => [...prev, item])
  }, [])

  const handleCommand = useCallback(async (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return

    /* ── Inside blueprint Q&A flow ── */
    if (flow?.kind === 'blueprint') {
      const def = FLOW_DEFS[flow.type]
      const newAnswers = [...flow.answers, trimmed]

      setCmdHistory(prev => [trimmed, ...prev])
      setCmdIdx(-1)
      push({ type: 'input', text: trimmed })

      if (flow.step < def.questions.length - 1) {
        const nextStep = flow.step + 1
        setFlow({ ...flow, step: nextStep, answers: newAnswers })
        push({
          type: 'question',
          text: def.questions[nextStep],
          qNum: nextStep + 1,
          total: def.questions.length,
          label: def.answerLabels[nextStep],
        })
      } else {
        // All answers collected — save to DB
        setFlow(null)
        push({ type: 'processing', text: 'saving blueprint...' })
        const saved = await saveBlueprint(flow.type, newAnswers, accessId).catch(() => null)
        const bp = { flowType: flow.type, answers: newAnswers, dbId: saved?.id ?? null }
        setLastBlueprint(bp)
        if (saved?.id) setSavedIds(prev => new Set([...prev, saved.id]))
        setHistory(prev => {
          const next = prev.filter(i => !(i.type === 'processing'))
          return [...next, { type: 'blueprint', flowType: bp.flowType, answers: bp.answers, dbId: bp.dbId }]
        })
      }
      setInput('')
      return
    }

    /* ── Inside system registration flow ── */
    if (flow?.kind === 'register') {
      setCmdHistory(prev => [trimmed, ...prev])
      setCmdIdx(-1)
      push({ type: 'input', text: trimmed })

      if (flow.step === 'name') {
        const suggested = deriveSystemHandle(trimmed)
        const updated: RegisterFlow = { ...flow, step: 'confirm-id', name: trimmed, suggestedHandle: suggested }
        setFlow(updated)
        push({ type: 'register-confirm', suggestedHandle: suggested, name: trimmed })
      } else if (flow.step === 'confirm-id') {
        // User either pressed enter (use suggested) or typed a custom handle
        const isCustom = trimmed.length > 0 && trimmed !== flow.suggestedHandle
        const finalHandle = isCustom
          ? trimmed.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/\.access$/, '') + '.access'
          : (flow.suggestedHandle ?? deriveSystemHandle(flow.name ?? 'my-system'))

        const systemName = flow.name ?? 'My System'
        setFlow(null)
        push({ type: 'processing', text: 'registering system...' })

        // Auto-save blueprint if answers provided but no saved blueprint yet
        let resolvedBlueprintId = flow.blueprintDbId ?? undefined
        if (flow.blueprintAnswers && flow.blueprintAnswers.length > 0 && !resolvedBlueprintId) {
          const bp = await saveBlueprint(
            flow.blueprintType ?? 'ai',
            flow.blueprintAnswers,
            accessId
          ).catch(() => null)
          if (bp) resolvedBlueprintId = bp.id
        }

        const system = await createSystem({
          name: systemName,
          systemHandle: finalHandle,
          ownerHandle: accessId,
          type: flow.blueprintType ?? 'ai',
          description: flow.blueprintAnswers?.[1] ? 'Generated by JYSON Value Architecture Engine' : (flow.blueprintAnswers?.[0] ?? undefined),
          blueprintId: resolvedBlueprintId,
        }).catch(() => null)

        setHistory(prev => {
          const next = prev.filter(i => !(i.type === 'processing'))
          if (!system) {
            return [...next, { type: 'info', text: 'System registration failed. Please try again.' }]
          }
          return [...next, { type: 'system-registered', system }]
        })

        if (system) {
          setSystemCount(c => c + 1)

          // Auto-create Builder Project from JYSON payload
          const projectData = jysonHandoff?.project
          if (projectData) {
            createBuilderProject({
              name: projectData.name,
              objective: projectData.objective,
              systemId: system.id,
              ownerHandle: accessId,
              milestones: projectData.milestones.map(m => ({ text: m, completed: false } as Milestone)),
              tasks: projectData.tasks.map(t => ({ text: t, completed: false } as Task)),
              stack: projectData.stack,
              architecture: jysonHandoff?.architecture,
            }).then(project => {
              if (project) setHistory(prev => [...prev, { type: 'project-created', project }])
            }).catch(() => null)
          }

          setJysonHandoff(null)
        }
      }
      setInput('')
      return
    }

    /* ── Inside registry object flow ── */
    if (flow?.kind === 'registry-object') {
      setCmdHistory(prev => [trimmed, ...prev])
      setCmdIdx(-1)
      push({ type: 'input', text: trimmed })

      if (flow.step === 0) {
        // Got name — ask description
        setFlow({ ...flow, step: 1, name: trimmed })
        push({
          type: 'registry-question',
          objectType: flow.objectType,
          questionText: REGISTRY_FLOW_DEFS[flow.objectType].q2,
          step: 1,
        })
      } else {
        // Got description — create object
        const name = flow.name ?? trimmed
        const description = trimmed
        setFlow(null)
        push({ type: 'processing', text: `registering ${flow.objectType}...` })

        let created = false
        try {
          switch (flow.objectType) {
            case 'agent':    created = !!(await createAgent(accessId, name, description)); break
            case 'asset':    created = !!(await createAsset(accessId, name, description)); break
            case 'workflow': created = !!(await createWorkflow(accessId, name, description)); break
            case 'vault':    created = !!(await createVault(accessId, name, description)); break
            case 'offer':    created = !!(await createOffer(accessId, name, description)); break
          }
        } catch { created = false }

        // Refresh registry summary
        getRegistrySummary(accessId).then(s => setRegistrySummary(s)).catch(() => null)

        setHistory(prev => {
          const next = prev.filter(i => i.type !== 'processing')
          if (!created) return [...next, { type: 'info', text: `Registration failed. Check Supabase configuration.` }]
          return [...next, { type: 'registry-registered', objectType: flow.objectType, name }]
        })
      }
      setInput('')
      return
    }

    /* ── Standard command routing ── */
    let cmd = trimmed.toLowerCase()
    if (NUMBER_MAP[cmd]) cmd = NUMBER_MAP[cmd]

    setCmdHistory(prev => [cmd, ...prev])
    setCmdIdx(-1)
    push({ type: 'input', text: cmd })

    /* Session */
    if (cmd === '/logout') { signOut(); return }

    /* Builder Projects */
    if (cmd === '/my-projects') {
      push({ type: 'processing', text: 'loading projects...' })
      const projects = await listBuilderProjects().catch(() => [])
      setHistory(prev => {
        const next = prev.filter(i => i.type !== 'processing')
        return [...next, { type: 'project-list', projects }]
      })
      setInput('')
      return
    }

    /* Blueprint path starters */
    const FLOW_MAP: Record<string, FlowType> = {
      '/build-ai-system': 'ai',
      '/build-business': 'business',
      '/build-content-system': 'content',
      '/build-knowledge-system': 'knowledge',
    }
    if (FLOW_MAP[cmd]) {
      const ft = FLOW_MAP[cmd]
      const def = FLOW_DEFS[ft]
      setFlow({ kind: 'blueprint', type: ft, step: 0, answers: [] })
      push({ type: 'flow-intro', flowType: ft })
      push({ type: 'question', text: def.questions[0], qNum: 1, total: def.questions.length, label: def.answerLabels[0] })
      setInput('')
      return
    }

    /* Register system */
    if (cmd === '/register-system') {
      if (jysonHandoff) {
        // Pre-fill registration from JYSON handoff — skip name step
        const suggested = deriveSystemHandle(jysonHandoff.name)
        setFlow({
          kind: 'register',
          step: 'confirm-id',
          blueprintType: jysonHandoff.type,
          blueprintAnswers: [jysonHandoff.name, jysonHandoff.architecture],
          blueprintDbId: null,
          suggestedHandle: suggested,
          name: jysonHandoff.name,
        })
        push({ type: 'register-confirm', suggestedHandle: suggested, name: jysonHandoff.name })
      } else {
        const hasBlueprint = !!lastBlueprint
        setFlow({
          kind: 'register',
          step: 'name',
          blueprintType: lastBlueprint?.flowType ?? null,
          blueprintAnswers: lastBlueprint?.answers ?? null,
          blueprintDbId: lastBlueprint?.dbId ?? null,
          suggestedHandle: null,
          name: null,
        })
        push({ type: 'register-intro', flowType: hasBlueprint ? lastBlueprint!.flowType : null })
      }
      setInput('')
      return
    }

    /* Blueprint save/copy/export */
    if (cmd === '/save-blueprint') {
      if (!lastBlueprint) {
        push({ type: 'info', text: 'No blueprint active. Generate one first with /start or /build-ai-system.' })
      } else if (lastBlueprint.dbId) {
        push({ type: 'info', text: '✓ Blueprint already saved to your ACCESS workspace.', success: true })
      } else {
        push({ type: 'processing', text: 'saving...' })
        const saved = await saveBlueprint(lastBlueprint.flowType, lastBlueprint.answers, accessId).catch(() => null)
        setHistory(prev => {
          const next = prev.filter(i => i.type !== 'processing')
          return [...next, saved
            ? { type: 'info', text: '✓ Blueprint saved to your ACCESS workspace.', success: true }
            : { type: 'info', text: 'Could not save. Supabase may not be configured yet.' }
          ]
        })
        if (saved) {
          setLastBlueprint({ ...lastBlueprint, dbId: saved.id })
          setSavedIds(prev => new Set([...prev, saved.id]))
        }
      }
      setInput('')
      return
    }
    if (cmd === '/copy-blueprint') {
      if (!lastBlueprint) {
        push({ type: 'info', text: 'No blueprint active. Generate one first.' })
      } else {
        handleCopyBlueprint(lastBlueprint)
        push({ type: 'info', text: '✓ Blueprint copied to clipboard.', success: true })
      }
      setInput('')
      return
    }
    if (cmd === '/export-blueprint') {
      if (!lastBlueprint) {
        push({ type: 'info', text: 'No blueprint active. Generate one first.' })
      } else {
        handleExportBlueprint(lastBlueprint)
        push({ type: 'info', text: '✓ Blueprint exported as .md file.', success: true })
      }
      setInput('')
      return
    }
    if (cmd === '/email-blueprint') {
      push({ type: 'info', text: 'Email export is coming soon. Use /export-blueprint or /copy-blueprint for now.' })
      setInput('')
      return
    }
    if (cmd === '/start-over') {
      setFlow(null)
      setLastBlueprint(null)
      push({ type: 'output', command: '/start' })
      setInput('')
      return
    }

    /* My blueprints */
    if (cmd === '/my-blueprints') {
      push({ type: 'processing', text: 'loading blueprints...' })
      const list = await listBlueprints().catch(() => [])
      setHistory(prev => {
        const next = prev.filter(i => i.type !== 'processing')
        return [...next, { type: 'blueprint-list', blueprints: list }]
      })
      setInput('')
      return
    }
    if (cmd.startsWith('/open-blueprint ')) {
      const idx = parseInt(cmd.replace('/open-blueprint ', ''), 10) - 1
      push({ type: 'processing', text: 'loading...' })
      const list = await listBlueprints().catch(() => [])
      const bp = list[idx]
      setHistory(prev => {
        const next = prev.filter(i => i.type !== 'processing')
        if (!bp) return [...next, { type: 'info', text: `Blueprint ${idx + 1} not found. Type /my-blueprints to see your list.` }]
        const bpObj = { flowType: bp.type as FlowType, answers: bp.answers as string[], dbId: bp.id }
        setLastBlueprint(bpObj)
        if (bp.id) setSavedIds(prev => new Set([...prev, bp.id]))
        return [...next, { type: 'blueprint', flowType: bp.type as FlowType, answers: bp.answers as string[], dbId: bp.id }]
      })
      setInput('')
      return
    }
    if (cmd.startsWith('/delete-blueprint ')) {
      const idx = parseInt(cmd.replace('/delete-blueprint ', ''), 10) - 1
      push({ type: 'processing', text: 'deleting...' })
      const list = await listBlueprints().catch(() => [])
      const bp = list[idx]
      if (!bp) {
        setHistory(prev => [...prev.filter(i => i.type !== 'processing'), { type: 'info', text: `Blueprint ${idx + 1} not found.` }])
      } else {
        await deleteBlueprintAction(bp.id).catch(() => null)
        setHistory(prev => [...prev.filter(i => i.type !== 'processing'), { type: 'info', text: `✓ Deleted: ${FLOW_TYPE_LABELS[bp.type as FlowType]} Blueprint`, success: true }])
      }
      setInput('')
      return
    }

    /* My systems */
    if (cmd === '/my-systems') {
      push({ type: 'processing', text: 'loading systems...' })
      const systems = await listSystems().catch(() => [])
      setHistory(prev => {
        const next = prev.filter(i => i.type !== 'processing')
        return [...next, { type: 'system-list', systems }]
      })
      setSystemCount(systems.length)
      setInput('')
      return
    }

    /* /open-system <handle> or /system-status <handle> */
    if (cmd.startsWith('/open-system ') || cmd.startsWith('/system-status ')) {
      const handle = cmd.replace(/^\/(open-system|system-status)\s+/, '').trim()
      const lookup = handle.includes('.access') ? handle : handle + '.access'
      push({ type: 'processing', text: 'loading system...' })
      const system = await getSystem(lookup).catch(() => null)
      setHistory(prev => {
        const next = prev.filter(i => i.type !== 'processing')
        if (!system) return [...next, { type: 'info', text: `System "${lookup}" not found. Type /my-systems to see your list.` }]
        return [...next, { type: 'system-detail', system }]
      })
      setInput('')
      return
    }

    /* /delete-system <handle> */
    if (cmd.startsWith('/delete-system ')) {
      const handle = cmd.replace('/delete-system ', '').trim()
      const lookup = handle.includes('.access') ? handle : handle + '.access'
      push({ type: 'processing', text: 'archiving system...' })
      const ok = await deleteSystemAction(lookup).catch(() => false)
      setHistory(prev => {
        const next = prev.filter(i => i.type !== 'processing')
        return [...next, ok
          ? { type: 'info', text: `✓ System "${lookup}" archived.`, success: true }
          : { type: 'info', text: `System "${lookup}" not found or could not be deleted.` }
        ]
      })
      if (ok) setSystemCount(c => Math.max(0, c - 1))
      setInput('')
      return
    }

    /* /my-id */
    if (cmd === '/my-id') {
      push({ type: 'id-card', systemCount })
      setInput('')
      return
    }

    /* /registry — reload and show full registry panel */
    if (cmd === '/registry') {
      push({ type: 'processing', text: 'loading registry...' })
      const summary = await getRegistrySummary(accessId).catch(() => null)
      setHistory(prev => {
        const next = prev.filter(i => i.type !== 'processing')
        if (!summary) return [...next, { type: 'info', text: 'Could not load registry. Check connection.' }]
        setRegistrySummary(summary)
        return [...next, { type: 'registry-panel', summary }]
      })
      setInput('')
      return
    }

    /* Registry object registration starters */
    const REGISTRY_CMD_MAP: Record<string, RegistryObjectType> = {
      '/register-agent':    'agent',
      '/register-asset':    'asset',
      '/register-workflow': 'workflow',
      '/register-vault':    'vault',
      '/register-offer':    'offer',
    }
    if (REGISTRY_CMD_MAP[cmd]) {
      const objType = REGISTRY_CMD_MAP[cmd]
      setFlow({ kind: 'registry-object', objectType: objType, step: 0, name: null })
      push({
        type: 'registry-question',
        objectType: objType,
        questionText: REGISTRY_FLOW_DEFS[objType].q1,
        step: 0,
      })
      setInput('')
      return
    }

    /* Registry list commands */
    const REGISTRY_LIST_MAP: Record<string, () => Promise<Array<{ id: string; name: string; description: string | null; created_at: string }>>> = {
      '/my-agents':    listAgents,
      '/my-assets':    listAssets,
      '/my-workflows': listWorkflows,
      '/my-vaults':    listVaults,
      '/my-offers':    listOffers,
    }
    const REGISTRY_LIST_TYPE_MAP: Record<string, RegistryObjectType> = {
      '/my-agents': 'agent', '/my-assets': 'asset', '/my-workflows': 'workflow', '/my-vaults': 'vault', '/my-offers': 'offer',
    }
    if (REGISTRY_LIST_MAP[cmd]) {
      const objType = REGISTRY_LIST_TYPE_MAP[cmd]
      push({ type: 'processing', text: `loading ${objType}s...` })
      const items = await REGISTRY_LIST_MAP[cmd]().catch(() => [])
      setHistory(prev => {
        const next = prev.filter(i => i.type !== 'processing')
        return [...next, { type: 'registry-list', objectType: objType, items }]
      })
      setInput('')
      return
    }

    /* /connect-jyson */
    if (cmd === '/connect-jyson') {
      push({
        type: 'info',
        text: [
          'CONNECT JYSON',
          '',
          'JYSON is the Value Architecture Engine inside JD AI Systems.',
          'It discovers, structures, and builds — ACCESS registers what it creates.',
          '',
          'Future flow:',
          '  JYSON creates a system blueprint',
          '  → Blueprint is sent to ACCESS',
          '  → ACCESS registers the system under your identity',
          '  → You own it at username.access',
          '',
          'JYSON connection is coming in a future release.',
          'Your ACCESS ID is already registered and ready to receive it.',
        ].join('\n'),
      })
      setInput('')
      return
    }

    /* Standard output commands */
    if (AVAILABLE_COMMANDS.includes(cmd)) {
      push({ type: 'output', command: cmd })
    } else {
      push({ type: 'error', text: `command not found: ${cmd}  —  try: ${getSuggestions(cmd).join('  ')}` })
    }
    setInput('')
  }, [flow, lastBlueprint, accessId, username, systemCount, push, handleCopyBlueprint, handleExportBlueprint, signOut])

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

  /* ─── Render helpers ─────────────────────────────────────── */
  const divider = { borderTop: '1px solid rgba(255,255,255,0.06)', margin: '4px 0 16px' }

  const Row = ({ k, v, color = 'var(--text-dim)' }: { k: string; v: string; color?: string }) => (
    <div style={{ display: 'flex', gap: '24px', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', width: '140px', flexShrink: 0 }}>{k}</span>
      <span style={{ color, fontSize: '12px' }}>{v}</span>
    </div>
  )

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
            {systemCount > 0 && (
              <span>
                <span style={{ color: 'var(--text-dim)' }}>systems</span>{'  '}
                <span style={{ color: 'var(--text)' }}>{systemCount}</span>
              </span>
            )}
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
            <div style={divider} />

            {/* Welcome line */}
            <div style={{ marginBottom: '16px', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 300 }}>
              Welcome, {displayName}.
            </div>

            {/* Registry Panel — primary view */}
            {registrySummary ? (
              <RegistryPanel summary={registrySummary} onCommand={handleCommand} />
            ) : (
              <div style={{
                maxWidth: '600px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '2px',
                padding: '20px', marginBottom: '24px', background: 'rgba(255,255,255,0.012)',
              }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  ACCESS REGISTRY
                </div>
                <div style={{ fontSize: '15px', color: 'var(--accent)', marginBottom: '12px', fontWeight: 300 }}>{accessId}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Loading registry<span className="cursor" /></div>
              </div>
            )}

            {/* Quick action strip */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '600px', marginBottom: '20px' }}>
              {[
                ['/start',         'Build something new'],
                ['/register-system','Register a system'],
                ['/connect-jyson', 'Connect JYSON'],
                ['/my-id',         'Your identity'],
                ['/help',          'All commands'],
              ].map(([cmd, label]) => (
                <button key={cmd}
                  onClick={e => { e.stopPropagation(); handleCommand(cmd) }}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '2px', padding: '6px 12px',
                    cursor: 'pointer', transition: 'border-color 0.15s',
                    display: 'flex', flexDirection: 'column', gap: '2px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(64,192,208,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ color: 'var(--accent)', fontSize: '10px', letterSpacing: '0.1em' }}>{cmd}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{label}</div>
                </button>
              ))}
              <button
                onClick={e => { e.stopPropagation(); signOut() }}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '2px', padding: '6px 12px',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                  display: 'flex', flexDirection: 'column', gap: '2px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(200,106,106,0.4)'
                  const d = e.currentTarget.querySelector('.lo') as HTMLElement
                  if (d) d.style.color = 'rgba(200,106,106,0.8)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  const d = e.currentTarget.querySelector('.lo') as HTMLElement
                  if (d) d.style.color = 'var(--text-muted)'
                }}
              >
                <div className="lo" style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.1em', transition: 'color 0.15s' }}>/logout</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>End session</div>
              </button>
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

            {item.type === 'processing' && (
              <div className="mb-2" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                {item.text}<span className="cursor" />
              </div>
            )}

            {item.type === 'flow-intro' && (
              <div className="mb-2 mt-2" style={{
                padding: '14px 18px',
                borderLeft: '2px solid rgba(64,192,208,0.3)',
                background: 'rgba(64,192,208,0.02)',
              }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '6px' }}>
                  {FLOW_DEFS[item.flowType].label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.7' }}>
                  {FLOW_DEFS[item.flowType].intro}
                </div>
              </div>
            )}

            {item.type === 'question' && (
              <div className="mb-1 mt-4">
                <div style={{ fontSize: '9px', letterSpacing: '0.16em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '5px' }}>
                  Question {item.qNum} of {item.total}
                  <span style={{ color: 'rgba(64,192,208,0.4)', marginLeft: '10px' }}>{item.label}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.65' }}>{item.text}</div>
              </div>
            )}

            {item.type === 'register-intro' && (
              <div className="mb-2 mt-4" style={{ padding: '14px 18px', borderLeft: '2px solid rgba(64,192,208,0.3)', background: 'rgba(64,192,208,0.02)' }}>
                <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '6px' }}>
                  REGISTER NEW SYSTEM
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.7', marginBottom: '10px' }}>
                  {item.flowType
                    ? `Your ${FLOW_TYPE_LABELS[item.flowType]} blueprint is ready to become a registered system.`
                    : 'Every system in ACCESS receives its own identity — persistent and independent of your account.'
                  }
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)' }}>
                  What will you call this system?
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Example: JD AI Systems OS  ·  My Content Machine  ·  Knowledge Base AI
                </div>
              </div>
            )}

            {item.type === 'register-confirm' && (
              <div className="mb-2 mt-4">
                <div style={{ fontSize: '9px', letterSpacing: '0.16em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  SYSTEM IDENTITY
                </div>
                <div style={{ fontSize: '18px', color: 'var(--accent)', fontWeight: 300, letterSpacing: '0.08em', marginBottom: '10px' }}>
                  {item.suggestedHandle}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.7', marginBottom: '8px' }}>
                  This will be your system's unique identifier inside ACCESS.
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Press ENTER to confirm this identity, or type a different name for the handle.
                </div>
              </div>
            )}

            {item.type === 'blueprint' && (() => {
              const key = `${item.flowType}-${item.answers[0]}`
              return (
                <div className="mb-6 mt-4">
                  <BlueprintDisplay
                    flowType={item.flowType}
                    answers={item.answers}
                    username={username}
                    savedState={item.dbId ? 'saved' : savedIds.has(item.dbId ?? '') ? 'saved' : 'unsaved'}
                    copiedState={copiedId === key}
                    onSave={() => {
                      if (!item.dbId) handleCommand('/save-blueprint')
                    }}
                    onCopy={() => handleCopyBlueprint({ flowType: item.flowType, answers: item.answers })}
                    onExport={() => handleExportBlueprint({ flowType: item.flowType, answers: item.answers })}
                    onStartOver={() => handleCommand('/start-over')}
                    onRegisterSystem={() => handleCommand('/register-system')}
                  />
                </div>
              )
            })()}

            {item.type === 'system-registered' && (
              <div className="mb-6 mt-4">
                <div style={{ borderLeft: '2px solid var(--success)', padding: '14px 18px', background: 'rgba(75,189,160,0.03)' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--success)', marginBottom: '12px' }}>
                    ✓ ENTITY REGISTERED
                  </div>
                  <div style={{ fontSize: '16px', color: 'var(--text)', fontWeight: 500, marginBottom: '14px' }}>
                    {item.system.name}
                  </div>
                  <Row k="Entity Identity" v={item.system.system_handle} color="var(--accent)" />
                  <Row k="Owner" v={item.system.owner_handle} color="var(--text-dim)" />
                  <Row k="Type" v={FLOW_TYPE_LABELS[item.system.type as FlowType]} color="var(--text-dim)" />
                  <Row k="Registry Status" v="Registered" color="var(--success)" />
                  <Row k="Activation" v="Pending" color="rgba(251,191,36,0.8)" />
                  <Row k="Capabilities" v="None assigned" color="var(--text-muted)" />
                  <Row k="Connections" v="None" color="var(--text-muted)" />
                  <Row k="Created" v={new Date(item.system.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} color="var(--text-dim)" />
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '14px', lineHeight: '1.7', fontFamily: 'var(--mono)' }}>
                    This entity now has a permanent identity inside ACCESS. Registration is the first step.
                    Activation — connecting capabilities, tools, and interfaces — is next.
                    Type <span style={{ color: 'var(--accent)' }}>/my-systems</span> to view all registered entities.
                  </p>
                </div>
              </div>
            )}

            {item.type === 'info' && (
              <div className="mb-3" style={{ color: item.success ? 'var(--success)' : 'var(--text-dim)', fontSize: '12px', whiteSpace: 'pre-line', lineHeight: '1.75' }}>
                {item.text}
              </div>
            )}

            {item.type === 'id-card' && (
              <div className="mb-6 mt-4">
                <AccessIdCard username={username} connectedSystems={item.systemCount} />
              </div>
            )}

            {item.type === 'blueprint-list' && (
              <div className="mb-6 mt-2">
                <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '14px' }}>
                  ARCHITECTURES
                </div>
                {item.blueprints.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    No architectures yet. Begin with /start or /build-ai-system.
                  </div>
                ) : (
                  <>
                    {item.blueprints.map((bp, idx) => (
                      <div key={bp.id} style={{ display: 'flex', gap: '16px', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', width: '16px', flexShrink: 0 }}>{idx + 1}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ color: 'var(--text)', fontSize: '12px' }}>{FLOW_TYPE_LABELS[bp.type as FlowType]} Architecture</span>
                          {bp.system_id && <span style={{ color: 'var(--accent)', fontSize: '10px', marginLeft: '10px' }}>↗ entity registered</span>}
                          <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: '12px' }}>
                            {new Date(bp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>/open-blueprint {idx + 1}</span>
                      </div>
                    ))}
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '12px', lineHeight: '1.7' }}>
                      /open-blueprint [n]  ·  /delete-blueprint [n]  ·  /register-system to create the entity
                    </div>
                  </>
                )}
              </div>
            )}

            {item.type === 'system-list' && (
              <div className="mb-6 mt-2">
                <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '14px' }}>
                  MY SYSTEMS
                </div>
                {item.systems.length === 0 ? (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '8px' }}>
                      No registered systems yet.
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      Generate a blueprint and type <span style={{ color: 'var(--accent)' }}>/register-system</span> to create your first system.
                    </div>
                  </div>
                ) : (
                  <>
                    {item.systems.map((sys, idx) => (
                      <div key={sys.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 500 }}>{sys.name}</span>
                          <span style={{ color: 'var(--success)', fontSize: '9px', letterSpacing: '0.12em' }}>ACTIVE</span>
                        </div>
                        <div style={{ color: 'var(--accent)', fontSize: '11px', marginBottom: '3px' }}>{sys.system_handle}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                          {FLOW_TYPE_LABELS[sys.type as FlowType]}
                          {'  ·  '}
                          {new Date(sys.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px' }}>
                          /open-system {sys.system_handle}
                        </div>
                      </div>
                    ))}
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '12px' }}>
                      /open-system [handle]  ·  /delete-system [handle]
                    </div>
                  </>
                )}
              </div>
            )}

            {item.type === 'jyson-handoff' && (
              <div className="mb-6 mt-4" style={{
                padding: '18px 20px',
                borderLeft: '2px solid rgba(64,192,208,0.4)',
                background: 'rgba(64,192,208,0.025)',
              }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(64,192,208,0.6)', marginBottom: '12px' }}>
                  ← ENTITY READY FOR REGISTRATION · JYSON
                </div>
                <div style={{ fontSize: '15px', color: 'var(--text)', fontWeight: 500, marginBottom: '6px' }}>
                  {item.payload.name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {FLOW_TYPE_LABELS[item.payload.type]} · Value Architecture Engine
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.7', marginBottom: '16px' }}>
                  JYSON has structured this system. Register it here to assign it a permanent identity, ownership, and an activation path inside ACCESS.
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleCommand('/register-system') }}
                  style={{
                    background: 'rgba(64,192,208,0.06)',
                    border: '1px solid rgba(64,192,208,0.3)',
                    borderRadius: '2px',
                    padding: '9px 18px',
                    color: 'rgba(64,192,208,0.9)',
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    fontFamily: 'var(--mono)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(64,192,208,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(64,192,208,0.06)')}
                >
                  /register-system
                </button>
              </div>
            )}

            {item.type === 'project-created' && (
              <div className="mb-6 mt-4" style={{
                padding: '18px 20px',
                borderLeft: '2px solid var(--success)',
                background: 'rgba(75,189,160,0.03)',
              }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--success)', marginBottom: '12px' }}>
                  ✓ BUILDER PROJECT CREATED
                </div>
                <div style={{ fontSize: '15px', color: 'var(--text)', fontWeight: 500, marginBottom: '6px' }}>
                  {item.project.name}
                </div>
                {item.project.objective && (
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.7', marginBottom: '12px' }}>
                    {item.project.objective}
                  </div>
                )}
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '14px' }}>
                  {item.project.tasks.length > 0 && `${item.project.tasks.length} tasks  ·  `}
                  {item.project.milestones.length > 0 && `${item.project.milestones.length} milestones  ·  `}
                  {item.project.stack.length > 0 && `${item.project.stack.length} tools`}
                </div>
                {item.project.tasks.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    {item.project.tasks.slice(0, 3).map((task, ti) => (
                      <div key={ti} style={{ display: 'flex', gap: '8px', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '1px', flexShrink: 0 }}>○</span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.5' }}>{task.text}</span>
                      </div>
                    ))}
                    {item.project.tasks.length > 3 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '6px' }}>
                        +{item.project.tasks.length - 3} more tasks  ·  /my-projects to view all
                      </div>
                    )}
                  </div>
                )}
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Type <span style={{ color: 'var(--accent)' }}>/my-projects</span> to view your workspace.
                </div>
              </div>
            )}

            {item.type === 'project-list' && (
              <div className="mb-6 mt-2">
                <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px' }}>
                  BUILDER WORKSPACE
                </div>

                {item.projects.length === 0 ? (
                  <div style={{ padding: '20px 0' }}>
                    <div style={{ color: 'var(--text-dim)', fontSize: '13px', marginBottom: '6px' }}>
                      No systems are being built yet.
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', lineHeight: '1.7', marginBottom: '16px' }}>
                      Generate an architecture in JYSON and click &ldquo;Open Workspace in ACCESS&rdquo;
                      to automatically create a Builder Project.
                    </div>
                    <a
                      href={process.env.NEXT_PUBLIC_JYSON_URL ?? 'https://jyson.vercel.app'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '8px 18px',
                        background: 'rgba(64,192,208,0.08)', border: '1px solid rgba(64,192,208,0.25)',
                        borderRadius: '2px', textDecoration: 'none',
                        fontSize: '10px', letterSpacing: '0.1em', color: 'var(--accent)',
                        fontFamily: 'var(--mono)', textTransform: 'uppercase' as const,
                      }}
                    >
                      Start with JYSON ↗
                    </a>
                  </div>
                ) : (
                  <>
                    {item.projects.map((proj) => {
                      const done = proj.tasks.filter(t => t.completed).length
                      const total = proj.tasks.length
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0
                      const completedMilestones = proj.milestones.filter(m => m.completed).length

                      return (
                        <div key={proj.id} style={{
                          padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}>
                          {/* Title + progress pct */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'flex-start', gap: '12px' }}>
                            <span style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 400, flex: 1 }}>{proj.name}</span>
                            <span style={{
                              color: pct === 100 ? 'var(--success)' : 'var(--text-muted)',
                              fontSize: '10px', flexShrink: 0,
                            }}>
                              {pct === 100 ? '✓ Complete' : `${pct}%`}
                            </span>
                          </div>

                          {/* Objective */}
                          {proj.objective && (
                            <div style={{ color: 'var(--text-dim)', fontSize: '11px', marginBottom: '8px', lineHeight: '1.6' }}>
                              {proj.objective.length > 110 ? proj.objective.slice(0, 110) + '…' : proj.objective}
                            </div>
                          )}

                          {/* Meta */}
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '8px', lineHeight: '1.8' }}>
                            {total > 0 && `${done}/${total} tasks`}
                            {proj.milestones.length > 0 && `  ·  ${completedMilestones}/${proj.milestones.length} milestones`}
                            {proj.stack.length > 0 && `  ·  ${proj.stack.length} tools`}
                            {`  ·  ${new Date(proj.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                          </div>

                          {/* Progress bar */}
                          {total > 0 && (
                            <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px', overflow: 'hidden', marginBottom: '12px' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? 'var(--success)' : 'var(--accent)', transition: 'width 0.4s ease' }} />
                            </div>
                          )}

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {/* Primary: Continue Building */}
                            <a
                              href={`/projects/${proj.id}`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '5px 14px',
                                background: 'rgba(64,192,208,0.08)', border: '1px solid rgba(64,192,208,0.25)',
                                borderRadius: '2px', textDecoration: 'none',
                                fontSize: '9px', letterSpacing: '0.12em', color: 'var(--accent)',
                                fontFamily: 'var(--mono)', textTransform: 'uppercase' as const,
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(64,192,208,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(64,192,208,0.5)' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(64,192,208,0.08)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(64,192,208,0.25)' }}
                            >
                              Continue Building →
                            </a>

                            {/* View Architecture */}
                            {proj.architecture && (
                              <a
                                href={`/projects/${proj.id}`}
                                style={{
                                  display: 'inline-flex', alignItems: 'center',
                                  padding: '5px 12px',
                                  background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                                  borderRadius: '2px', textDecoration: 'none',
                                  fontSize: '9px', letterSpacing: '0.1em', color: 'var(--text-muted)',
                                  fontFamily: 'var(--mono)', textTransform: 'uppercase' as const,
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
                              >
                                View
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '14px', lineHeight: '1.8' }}>
                      Click &ldquo;Continue Building&rdquo; to open the full project workspace.
                    </div>
                  </>
                )}
              </div>
            )}

            {item.type === 'registry-panel' && (
              <div className="mb-6 mt-4">
                <RegistryPanel summary={item.summary} onCommand={handleCommand} />
              </div>
            )}

            {item.type === 'registry-question' && (
              <div className="mb-1 mt-4" style={{ paddingLeft: '2px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.16em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  {REGISTRY_FLOW_DEFS[item.objectType].label}
                  <span style={{ color: 'rgba(64,192,208,0.4)', marginLeft: '12px' }}>
                    {item.step === 0 ? 'name' : 'description'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.65' }}>{item.questionText}</div>
              </div>
            )}

            {item.type === 'registry-registered' && (
              <div className="mb-4 mt-2" style={{ borderLeft: '2px solid var(--success)', padding: '12px 16px', background: 'rgba(75,189,160,0.03)' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--success)', marginBottom: '6px' }}>
                  ✓ {item.objectType.toUpperCase()} REGISTERED
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '6px' }}>{item.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                  Owned by <span style={{ color: 'var(--accent)' }}>{accessId}</span>
                  {'  ·  '}/my-{item.objectType}s to view all
                  {'  ·  '}/registry to refresh
                </div>
              </div>
            )}

            {item.type === 'registry-list' && (
              <div className="mb-6 mt-2">
                <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '14px' }}>
                  MY {item.objectType.toUpperCase()}S
                </div>
                {item.items.length === 0 ? (
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px' }}>
                      No {item.objectType}s registered yet.
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      Type <span style={{ color: 'var(--accent)' }}>/register-{item.objectType}</span> to register your first.
                    </div>
                  </div>
                ) : (
                  <>
                    {item.items.map((obj, idx) => (
                      <div key={obj.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 400 }}>{obj.name}</span>
                          <span style={{ color: 'var(--success)', fontSize: '9px', letterSpacing: '0.12em' }}>ACTIVE</span>
                        </div>
                        {obj.description && (
                          <div style={{ color: 'var(--text-dim)', fontSize: '11px', lineHeight: '1.6', marginBottom: '3px' }}>
                            {obj.description.length > 100 ? obj.description.slice(0, 100) + '…' : obj.description}
                          </div>
                        )}
                        <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                          {new Date(obj.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {item.type === 'system-detail' && (
              <div className="mb-6 mt-4">
                <div style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '14px' }}>
                  ENTITY
                </div>
                <div style={{ fontSize: '16px', color: 'var(--text)', fontWeight: 500, marginBottom: '14px' }}>
                  {item.system.name}
                </div>
                <Row k="Entity Identity" v={item.system.system_handle} color="var(--accent)" />
                <Row k="Owner" v={item.system.owner_handle} />
                <Row k="Type" v={FLOW_TYPE_LABELS[item.system.type as FlowType]} />
                <Row k="Registry Status" v={item.system.status === 'active' ? 'Active' : item.system.status} color={item.system.status === 'active' ? 'var(--success)' : 'var(--gold)'} />
                <Row k="Activation" v={(item.system as System & { activation_status?: string }).activation_status ?? 'registered'} color={(item.system as System & { activation_status?: string }).activation_status === 'active' ? 'var(--success)' : 'rgba(251,191,36,0.8)'} />
                <Row k="Capabilities" v="None assigned" color="var(--text-muted)" />
                <Row k="Connections" v="None" color="var(--text-muted)" />
                <Row k="Architecture" v={item.system.blueprint_id ? 'Linked' : 'None'} />
                <Row k="Created" v={new Date(item.system.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                {item.system.description && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '5px' }}>Description</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.7' }}>{item.system.description}</div>
                  </div>
                )}
                <div style={{ marginTop: '16px', fontSize: '10px', color: 'var(--text-muted)' }}>
                  /delete-system {item.system.system_handle}  ·  /register-system to add another
                </div>
              </div>
            )}

          </div>
        ))}

        {/* Flow indicator */}
        {phase === 'active' && flow && (
          <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '4px', marginBottom: '4px', letterSpacing: '0.06em' }}>
            {flow.kind === 'blueprint'
              ? `answering question ${flow.step + 1} of ${FLOW_DEFS[flow.type].questions.length}  ·  type your answer`
              : flow.kind === 'register'
              ? (flow.step === 'name' ? 'registering system  ·  type the system name' : 'confirming system identity  ·  press enter or type a custom name')
              : `registering ${flow.objectType}  ·  ${flow.step === 0 ? 'type the name' : 'type the description'}`
            }
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
