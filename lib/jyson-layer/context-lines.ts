import { resolveAccessPageContext, pageContextLine } from '@/lib/access/page-context'
import { PRIMARY_NAV } from '@/lib/navigation/config'
import type { PrimaryNavId } from '@/lib/navigation/types'
import type { RegistrySummary } from '@/types/db'
import type { JysonRouteContext } from './types'

export function buildContextLine(route: JysonRouteContext, summary: RegistrySummary | null): string {
  const page = resolveAccessPageContext(route.pathname)
  const parts: string[] = [pageContextLine(page)]

  if (route.projectId) {
    parts.push(`project ${route.projectId}`)
  }
  if (route.companionSection) {
    parts.push(`section: ${route.companionSection}`)
  }

  const counts = summary?.registryCounts ?? summary?.counts
  if (counts) {
    const hints: string[] = []
    if ((counts.projects ?? 0) > 0) hints.push(`${counts.projects} project${counts.projects === 1 ? '' : 's'}`)
    if ((counts.agents ?? 0) > 0) hints.push(`${counts.agents} agent${counts.agents === 1 ? '' : 's'}`)
    if ((counts.systems ?? 0) > 0) hints.push(`${counts.systems} system${counts.systems === 1 ? '' : 's'}`)
    if (hints.length) parts.push(hints.join(' · '))
  }

  return parts.join(' · ')
}

export function buildGreeting(displayName: string | null, _summary: RegistrySummary | null): string {
  const first = displayName?.split(/\s+/)[0] ?? displayName
  const hour = new Date().getHours()
  const time =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  if (first) return `${time}, ${first}.`
  return `${time}.`
}

export function buildHomeHeadline(displayName: string | null): string {
  const first = displayName?.split(/\s+/)[0]
  if (first) return `Good morning, ${first}.`
  return 'Good morning.'
}

export function buildHomeStatsLine(summary: RegistrySummary | null, loading: boolean): string {
  if (loading) return 'Loading your workspace…'
  const counts = summary?.registryCounts ?? summary?.counts
  const projects = counts?.projects ?? 0
  const agents = counts?.agents ?? 0
  const systems = counts?.systems ?? 0
  return `You have ${projects} project${projects === 1 ? '' : 's'}, ${agents} agent${agents === 1 ? '' : 's'}, and ${systems} connected system${systems === 1 ? '' : 's'}.`
}

export function primaryNavHref(id: PrimaryNavId): string {
  return PRIMARY_NAV.find((n) => n.id === id)?.href ?? '/dashboard'
}
