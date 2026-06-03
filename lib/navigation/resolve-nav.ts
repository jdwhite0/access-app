import {
  COMPANION_HASH_IDS,
  FOUNDER_STEP_TO_CONTEXT,
} from './config'
import type {
  CompanionContextId,
  FounderContextId,
  PrimaryNavId,
} from './types'

export function resolvePrimaryNavId(pathname: string): PrimaryNavId | null {
  if (pathname === '/' || pathname === '') return null
  if (pathname.startsWith('/terminal')) return null
  if (pathname.startsWith('/dashboard')) return 'home'
  if (pathname.startsWith('/projects')) return 'projects'
  if (pathname.startsWith('/companion')) return 'companion'
  if (pathname.startsWith('/agents')) return 'agents'
  if (pathname.startsWith('/memory')) return 'memory'
  if (pathname.startsWith('/offers')) return 'offers'
  if (pathname.startsWith('/registry')) return 'registry'
  if (pathname.startsWith('/settings/billing')) return 'settings'
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/plans')) return 'settings'
  if (pathname.startsWith('/founder')) return null
  if (pathname.startsWith('/internal/command-center')) return 'settings'
  if (pathname.startsWith('/internal/status')) return 'settings'
  if (pathname.startsWith('/status')) return 'settings'
  if (pathname.startsWith('/onboarding')) return null
  return null
}

export function resolveFounderContext(
  searchParams: URLSearchParams | null
): FounderContextId | null {
  const step = searchParams?.get('step')
  if (!step) return null
  return FOUNDER_STEP_TO_CONTEXT[step] ?? null
}

export function resolveCompanionContext(hash: string): CompanionContextId | null {
  const id = hash.replace(/^#/, '')
  if (!id) return 'overview'
  return COMPANION_HASH_IDS.includes(id as CompanionContextId)
    ? (id as CompanionContextId)
    : null
}

export function resolveSettingsContext(pathname: string): string {
  if (pathname.startsWith('/settings/billing')) return 'billing'
  if (pathname.startsWith('/settings/profile')) return 'profile'
  if (pathname.startsWith('/settings/account')) return 'account'
  if (pathname.startsWith('/terminal')) return 'terminal'
  if (pathname.startsWith('/internal/command-center')) return 'command-center'
  if (pathname.startsWith('/internal/status')) return 'status'
  if (pathname.startsWith('/status')) return 'public-status'
  return 'general'
}

export function isOsShellRoute(pathname: string): boolean {
  return (
    pathname === '/dashboard' ||
    pathname === '/registry' ||
    pathname.startsWith('/dashboard/') ||
    pathname.startsWith('/registry/')
  )
}
