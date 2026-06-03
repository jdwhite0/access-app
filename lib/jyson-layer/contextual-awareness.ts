import type { PrimaryNavId } from '@/lib/navigation/types'
import type { RegistrySummary } from '@/types/db'
import { readRecentIntents } from '@/lib/design-system/components/platform/HomeCommandHero'
import type { JysonRouteContext } from './types'

const LAST_PLACE_KEY = 'access_last_place'
const WORK_FOCUS_KEY = 'access_work_focus'

export type AttentionItem = {
  id: string
  text: string
  action?: string
}

export type ContextualHome = {
  headline: string
  insight: string
  attention: AttentionItem[]
  commandPlaceholder: string
}

const PLACE_FOCUS: Record<PrimaryNavId, string> = {
  home: 'your workspace',
  founder: 'your identity and blueprint',
  projects: 'your active projects',
  companion: 'deep intelligence',
  agents: 'your agent team',
  memory: 'your knowledge',
  offers: 'your offers',
  registry: 'your universe map',
  settings: 'preferences and billing',
}

export function recordLastPlace(pathname: string, primary: PrimaryNavId | null) {
  try {
    const payload = { pathname, primary, at: Date.now() }
    localStorage.setItem(LAST_PLACE_KEY, JSON.stringify(payload))
    if (primary && primary !== 'home') {
      localStorage.setItem(WORK_FOCUS_KEY, PLACE_FOCUS[primary])
    }
  } catch {
    /* ignore */
  }
}

function readLastPlace(): { pathname: string; primary: PrimaryNavId | null; at: number } | null {
  try {
    const raw = localStorage.getItem(LAST_PLACE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { pathname: string; primary: PrimaryNavId | null; at: number }
  } catch {
    return null
  }
}

function readWorkFocus(): string | null {
  try {
    return localStorage.getItem(WORK_FOCUS_KEY)
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
  const d = Date.now() - new Date(iso).getTime()
  return Math.floor(d / (1000 * 60 * 60 * 24))
}

export function buildContextualHome(input: {
  displayName: string | null
  summary: RegistrySummary | null
  loading: boolean
  route: JysonRouteContext
  plan?: string | null
}): ContextualHome {
  const first = input.displayName?.split(/\s+/)[0] ?? null
  const greet = first ? `${timeGreeting()}, ${first}.` : `${timeGreeting()}.`
  const counts = input.summary?.registryCounts ?? input.summary?.counts
  const projects = counts?.projects ?? 0
  const agents = counts?.agents ?? 0
  const systems = counts?.systems ?? 0
  const total = input.summary?.totalRegistered ?? 0
  const recent = readRecentIntents()
  const lastPlace = readLastPlace()
  const workFocus = readWorkFocus()
  const vaultDays = daysSince(input.summary?.vaultConnection?.lastSyncAt ?? null)

  const attention: AttentionItem[] = []

  if (input.loading) {
    return {
      headline: greet,
      insight: 'Pulling in your latest context…',
      attention: [],
      commandPlaceholder: 'Continue or ask anything…',
    }
  }

  // Primary insight — aware, not interrogative
  let insight = ''

  if (recent[0]) {
    const snippet = recent[0].length > 56 ? `${recent[0].slice(0, 56)}…` : recent[0]
    insight = `You were just working on: “${snippet}”.`
  } else if (workFocus) {
    insight = `You've been focused on ${workFocus}.`
  } else if (lastPlace?.primary && lastPlace.primary !== 'home') {
    insight = `Last session you were in ${PLACE_FOCUS[lastPlace.primary]}.`
  }

  if (projects > 0) {
    const projLine =
      projects === 1
        ? 'One project is registered and in motion.'
        : `${projects} projects are in motion.`
    insight = insight ? `${insight} ${projLine}` : projLine
  }

  if (vaultDays !== null && vaultDays === 0) {
    attention.push({
      id: 'vault-today',
      text: 'Your vault synced today — memory and files are current.',
    })
  } else if (vaultDays !== null && vaultDays <= 7) {
    attention.push({
      id: 'vault-week',
      text: `Vault synced ${vaultDays} day${vaultDays === 1 ? '' : 's'} ago.`,
    })
  }

  if (input.plan === 'free' || !input.plan) {
    attention.push({
      id: 'plan',
      text: 'Local tools and expanded registry unlock on Operator or Builder.',
      action: 'Compare plans',
    })
  }

  if (projects === 0 && total === 0) {
    attention.push({
      id: 'start',
      text: 'No projects mapped yet — tell me what you are building and I will structure it.',
      action: 'What am I building?',
    })
  } else {
    if (agents > 0) {
      attention.push({
        id: 'agents',
        text: `${agents} agent${agents === 1 ? '' : 's'} on your team.`,
        action: 'Open agents',
      })
    }
    if (systems > 0) {
      attention.push({
        id: 'systems',
        text: `${systems} system${systems === 1 ? '' : 's'} connected in your stack.`,
      })
    }
    attention.push({
      id: 'next',
      text: 'Here is what deserves attention next: pick up your latest thread or open Projects.',
      action: recent[0] ?? 'Show my projects',
    })
  }

  // Stripe integration / billing awareness from recent intent keywords
  const stripeMention = recent.some((r) => /stripe|billing|checkout|plan/i.test(r))
  if (stripeMention) {
    insight = "You've been working on Stripe integration."
    attention.unshift({
      id: 'stripe',
      text: 'Billing and webhooks — open Settings → Billing to confirm plan state.',
      action: 'Open billing',
    })
  }

  if (!insight) {
    insight =
      projects > 0
        ? 'Your workspace is active — ask me to continue anywhere.'
        : 'I am ready when you are — describe what you want to build.'
  }

  return {
    headline: greet,
    insight,
    attention: attention.slice(0, 4),
    commandPlaceholder: 'Continue or ask anything…',
  }
}

export function buildLayerOpener(
  route: JysonRouteContext,
  summary: RegistrySummary | null
): string {
  const home = buildContextualHome({
    displayName: null,
    summary,
    loading: false,
    route,
  })
  if (route.primary && route.primary !== 'home') {
    return `${PLACE_FOCUS[route.primary]} — ${home.insight}`
  }
  return home.insight
}
