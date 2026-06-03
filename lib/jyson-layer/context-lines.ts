import { PRIMARY_NAV } from '@/lib/navigation/config'
import type { PrimaryNavId } from '@/lib/navigation/types'
import type { RegistrySummary } from '@/types/db'
import type { JysonRouteContext } from './types'

const PLACE_LABEL: Record<PrimaryNavId, string> = {
  home: 'home',
  founder: 'your identity',
  projects: 'what you are building',
  companion: 'intelligence',
  agents: 'your team',
  memory: 'your knowledge',
  offers: 'what you sell',
  registry: 'your mapped universe',
  settings: 'preferences',
}

export function buildContextLine(route: JysonRouteContext, summary: RegistrySummary | null): string {
  const parts: string[] = []

  if (route.primary) {
    parts.push(`You're on ${PLACE_LABEL[route.primary]}`)
  } else if (route.pathname === '/') {
    parts.push("You're at the entry")
  } else {
    parts.push(`You're on ${route.pathname}`)
  }

  if (route.projectId) {
    parts.push(`project ${route.projectId}`)
  }
  if (route.companionSection) {
    parts.push(`focus: ${route.companionSection}`)
  }

  const counts = summary?.registryCounts ?? summary?.counts
  if (counts) {
    const hints: string[] = []
    if ((counts.projects ?? 0) > 0) hints.push(`${counts.projects} project${counts.projects === 1 ? '' : 's'}`)
    if ((counts.agents ?? 0) > 0) hints.push(`${counts.agents} agent${counts.agents === 1 ? '' : 's'}`)
    if ((counts.systems ?? 0) > 0) hints.push(`${counts.systems} system${counts.systems === 1 ? '' : 's'}`)
    if (hints.length) parts.push(`registry: ${hints.join(', ')}`)
  }

  return parts.join(' · ')
}

export function buildGreeting(displayName: string | null, summary: RegistrySummary | null): string {
  const first = displayName?.split(/\s+/)[0] ?? displayName
  const hour = new Date().getHours()
  const time =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  if (first) return `${time}, ${first}.`
  return `${time}.`
}

export function buildHomeHeadline(displayName: string | null): string {
  const first = displayName?.split(/\s+/)[0]
  if (first) return `Good morning, ${first}. What are we building today?`
  return "What are we building today?"
}

export function buildHomeSubline(summary: RegistrySummary | null, loading: boolean): string {
  if (loading) return "Let's continue building."
  const counts = summary?.registryCounts ?? summary?.counts
  const projects = counts?.projects ?? 0
  if (projects > 0) {
    return `You have ${projects} active project${projects === 1 ? '' : 's'} in motion.`
  }
  if (summary?.vaultConnection?.lastSyncAt) {
    return "Here's what changed — your vault synced recently."
  }
  return "Let's continue building."
}

export function primaryNavHref(id: PrimaryNavId): string {
  return PRIMARY_NAV.find((n) => n.id === id)?.href ?? '/dashboard'
}
