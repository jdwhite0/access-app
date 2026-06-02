import {
  COMPANION_HASH_IDS,
  FOUNDER_STEP_TO_CONTEXT,
} from './config'
import type {
  CompanionContextId,
  FounderContextId,
  PrimaryNavId,
} from './types'

export function resolvePrimaryNavId(pathname: string): PrimaryNavId {
  if (pathname === '/' || pathname === '') return 'terminal'
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/founder')) return 'founder'
  if (pathname.startsWith('/companion')) return 'companion'
  if (pathname.startsWith('/registry')) return 'registry'
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/internal/command-center')) return 'settings'
  if (pathname.startsWith('/internal/status')) return 'settings'
  return 'dashboard'
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
