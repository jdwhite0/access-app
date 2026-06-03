import { resolveAccessPageContext } from '@/lib/access/page-context'
import type { PrimaryNavId } from '@/lib/navigation/types'
import type { RegistrySummary } from '@/types/db'
import { readRecentIntents } from '@/lib/design-system/components/platform/HomeCommandHero'
import type { SnapshotRow } from '@/lib/design-system/components/platform/WorkspaceSnapshot'
import { buildHomeStatsLine } from './context-lines'
import type { JysonRouteContext } from './types'

const LAST_PLACE_KEY = 'access_last_place'
const WORK_FOCUS_KEY = 'access_work_focus'

export type AttentionItem = {
  id: string
  text: string
  action?: string
  href?: string
}

export type HomeQuickCard = {
  id: string
  title: string
  description: string
  href?: string
  actionLabel: string
  jysonPrompt?: string
}

export type ContextualHome = {
  headline: string
  focusLine: string
  insight: string
  statsLine: string
  attention: AttentionItem[]
  jysonRecommendations: AttentionItem[]
  commandPlaceholder: string
  continueCard: HomeQuickCard | null
  capabilityCards: HomeQuickCard[]
  workspaceSnapshot: SnapshotRow[]
}

export type JysonSuggestion = {
  id: string
  label: string
  prompt: string
}

const PLACE_FOCUS: Record<PrimaryNavId, string> = {
  home: 'Home',
  projects: 'Projects',
  companion: 'JYSON',
  agents: 'Agents',
  memory: 'Memory',
  offers: 'Offers',
  registry: 'Registry',
  settings: 'Settings',
}

const LAST_PLACE_LABEL: Record<string, string> = {
  '/dashboard': 'Home',
  '/projects': 'Projects',
  '/companion': 'JYSON',
  '/agents': 'Agents',
  '/memory': 'Memory',
  '/offers': 'Offers',
  '/registry': 'Registry',
  '/settings': 'Settings',
  '/settings/billing': 'Billing',
  '/plans': 'Plans',
  '/founder': 'Founder blueprint',
}

export function recordLastPlace(pathname: string, primary: PrimaryNavId | null) {
  try {
    const payload = { pathname, primary, at: Date.now() }
    localStorage.setItem(LAST_PLACE_KEY, JSON.stringify(payload))
    if (primary && primary !== 'home') {
      localStorage.setItem(WORK_FOCUS_KEY, PLACE_FOCUS[primary])
    } else if (pathname.startsWith('/founder')) {
      localStorage.setItem(WORK_FOCUS_KEY, 'Founder blueprint')
    }
  } catch {
    /* ignore */
  }
}

export function readLastPlace(): { pathname: string; primary: PrimaryNavId | null; at: number } | null {
  try {
    const raw = localStorage.getItem(LAST_PLACE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { pathname: string; primary: PrimaryNavId | null; at: number }
  } catch {
    return null
  }
}

function timeGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function daysSince(iso: string | undefined | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function readWorkFocus(): string | null {
  try {
    return localStorage.getItem(WORK_FOCUS_KEY)
  } catch {
    return null
  }
}

function buildFocusLine(projects: number): string {
  const workFocus = readWorkFocus()
  if (workFocus) {
    return `Your workspace is centered on ${workFocus}. Pick up where you left off or ask JYSON for the next step.`
  }
  if (projects > 0) {
    return `You are building across ${projects} project${projects === 1 ? '' : 's'}. Review priorities or ask JYSON what needs attention.`
  }
  return 'ACCESS is your intelligent workspace — projects, memory, and JYSON as your reasoning layer. Start by defining what you are building.'
}

export function buildWorkspaceSnapshot(
  summary: RegistrySummary | null,
  loading: boolean,
  plan: string | null | undefined,
  localToolsConnected?: boolean
): SnapshotRow[] {
  if (loading) {
    return [{ id: 'load', label: 'Workspace', value: 'Loading…' }]
  }
  const counts = summary?.registryCounts ?? summary?.counts
  const projects = counts?.projects ?? 0
  const agents = counts?.agents ?? 0
  const systems = counts?.systems ?? 0
  const vaultDays = daysSince(summary?.vaultConnection?.lastSyncAt ?? null)

  const rows: SnapshotRow[] = [
    { id: 'projects', label: 'Building', value: `${projects} project${projects === 1 ? '' : 's'}` },
    { id: 'agents', label: 'Delegation', value: `${agents} custom agent${agents === 1 ? '' : 's'}` },
    {
      id: 'registry',
      label: 'System records',
      value: `${systems} system${systems === 1 ? '' : 's'}`,
    },
  ]

  if (vaultDays !== null) {
    rows.push({
      id: 'vault',
      label: 'Memory sync',
      value: vaultDays === 0 ? 'Synced today' : `Synced ${vaultDays}d ago`,
      tone: vaultDays <= 7 ? 'operational' : 'neutral',
    })
  } else {
    rows.push({ id: 'vault', label: 'Memory sync', value: 'No vault sync yet', tone: 'neutral' })
  }

  rows.push({
    id: 'plan',
    label: 'Leverage',
    value: plan && plan !== 'free' ? `${plan} plan` : 'Free — upgrade for more leverage',
    tone: plan && plan !== 'free' ? 'operational' : 'neutral',
  })

  if (localToolsConnected !== undefined) {
    rows.push({
      id: 'local',
      label: 'Local tools',
      value: localToolsConnected ? 'Connected' : 'Not connected',
      tone: localToolsConnected ? 'operational' : 'offline',
    })
  }

  return rows
}

export function buildContextualHome(input: {
  displayName: string | null
  summary: RegistrySummary | null
  loading: boolean
  route: JysonRouteContext
  plan?: string | null
  localToolsConnected?: boolean
}): ContextualHome {
  const first = input.displayName?.split(/\s+/)[0] ?? null
  const greet = first ? `${timeGreeting()}, ${first}.` : `${timeGreeting()}.`
  const counts = input.summary?.registryCounts ?? input.summary?.counts
  const projects = counts?.projects ?? 0
  const agents = counts?.agents ?? 0
  const systems = counts?.systems ?? 0
  const lastPlace = readLastPlace()
  const statsLine = buildHomeStatsLine(input.summary, input.loading)
  const focusLine = input.loading ? 'Loading your workspace…' : buildFocusLine(projects)

  const jysonRecommendations: AttentionItem[] = []
  const attention: AttentionItem[] = []

  if (input.loading) {
    return {
      headline: greet,
      focusLine,
      insight: statsLine,
      statsLine,
      attention: [],
      jysonRecommendations: [],
      commandPlaceholder: 'Ask JYSON anything…',
      continueCard: null,
      capabilityCards: [],
      workspaceSnapshot: buildWorkspaceSnapshot(input.summary, true, input.plan),
    }
  }

  let insight = statsLine

  const recent = readRecentIntents()
  const stripeMention = recent.some((r) => /stripe|billing|checkout|subscription/i.test(r))
  if (stripeMention || input.plan === 'free' || !input.plan) {
    jysonRecommendations.push({
      id: 'billing',
      text: 'Finish subscription activation so ACCESS can accept paying users.',
      action: 'Manage billing',
      href: '/settings/billing',
    })
  }

  if (projects === 0) {
    jysonRecommendations.push({
      id: 'build',
      text: 'Define your first project so JYSON knows what you are building.',
      action: 'Create project',
      href: '/projects',
    })
  } else {
    jysonRecommendations.push({
      id: 'projects-priority',
      text: `Review ${projects} project${projects === 1 ? '' : 's'} and pick the next concrete task.`,
      action: 'View projects',
      href: '/projects',
    })
  }

  if (input.localToolsConnected === false) {
    jysonRecommendations.push({
      id: 'local',
      text: 'Connect local tools so JYSON can read files and your vault on this machine.',
      action: 'Connect local tools',
      href: '/companion#diagnostics',
    })
  }

  const vaultDays = daysSince(input.summary?.vaultConnection?.lastSyncAt ?? null)
  if (vaultDays !== null && vaultDays === 0) {
    attention.push({ id: 'vault', text: 'Vault synced today — memory is current.' })
  }

  if (agents === 0) {
    attention.push({
      id: 'agents',
      text: 'Register specialists in Agents when you need delegation beyond JYSON.',
      action: 'View agents',
      href: '/agents',
    })
  }

  if (systems === 0) {
    attention.push({
      id: 'registry',
      text: 'Map systems in Registry so JYSON understands your stack.',
      action: 'View registry',
      href: '/registry',
    })
  }

  let continueCard: HomeQuickCard | null = null
  if (lastPlace?.pathname && lastPlace.pathname !== '/dashboard') {
    const label = LAST_PLACE_LABEL[lastPlace.pathname] ?? 'last page'
    continueCard = {
      id: 'continue',
      title: 'Continue where you left off',
      description: `Return to ${label}.`,
      href: lastPlace.pathname,
      actionLabel: 'Continue',
    }
  }

  const capabilityCards: HomeQuickCard[] = [
    {
      id: 'projects',
      title: 'Review projects',
      description:
        projects > 0
          ? `${projects} project${projects === 1 ? '' : 's'} tracked in Building.`
          : 'No projects yet — create one or ask JYSON to help define one.',
      href: '/projects',
      actionLabel: projects > 0 ? 'View projects' : 'Create project',
      jysonPrompt: projects > 0 ? 'Summarize my active projects' : 'Help me define my first project',
    },
    {
      id: 'memory',
      title: 'Open memory',
      description: 'Review what JYSON knows from your blueprint and sessions.',
      href: '/memory',
      actionLabel: 'Open memory',
    },
    {
      id: 'local',
      title: 'Connect local tools',
      description:
        input.localToolsConnected
          ? 'OpenJarvis is connected — JYSON can use local files and vault.'
          : 'Start OpenJarvis and the connector to unlock local execution.',
      href: '/companion#diagnostics',
      actionLabel: input.localToolsConnected ? 'View connection' : 'Connect local tools',
    },
    {
      id: 'billing',
      title: 'Manage billing',
      description:
        input.plan && input.plan !== 'free'
          ? `You are on the ${input.plan} plan.`
          : 'Upgrade to unlock more agents, registry depth, and local tools.',
      href: '/settings/billing',
      actionLabel: 'Manage billing',
    },
  ]

  if (stripeMention) {
    insight = `You have been working on billing and subscriptions. ${statsLine}`
  }

  return {
    headline: greet,
    focusLine,
    insight,
    statsLine,
    attention: attention.slice(0, 3),
    jysonRecommendations: jysonRecommendations.slice(0, 3),
    commandPlaceholder: 'Ask JYSON anything…',
    continueCard,
    capabilityCards,
    workspaceSnapshot: buildWorkspaceSnapshot(
      input.summary,
      false,
      input.plan,
      input.localToolsConnected
    ),
  }
}

export function buildLayerOpener(route: JysonRouteContext, summary: RegistrySummary | null): string {
  const page = resolveAccessPageContext(route.pathname)
  const home = buildContextualHome({
    displayName: null,
    summary,
    loading: false,
    route,
  })
  if (route.pathname === '/dashboard' || route.primary === 'home') {
    return home.focusLine
  }
  return `${page.title} — ${page.purpose}`
}

export function buildJysonSuggestions(
  route: JysonRouteContext,
  _summary: RegistrySummary | null
): JysonSuggestion[] {
  const page = resolveAccessPageContext(route.pathname)
  const prompts = page.suggestedPrompts.slice(0, 4)
  return prompts.map((prompt, i) => ({
    id: `ctx-${i}`,
    label: prompt.length > 32 ? `${prompt.slice(0, 32)}…` : prompt,
    prompt,
  }))
}
