import type {
  CompanionContextId,
  ContextNavItem,
  FounderContextId,
  PrimaryNavItem,
} from './types'

export const PRIMARY_NAV: PrimaryNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', glyph: '▣' },
  { id: 'terminal', label: 'Terminal', href: '/terminal', glyph: '▸' },
  { id: 'founder', label: 'Founder', href: '/founder', glyph: '◫' },
  { id: 'companion', label: 'Companion', href: '/companion', glyph: '◎' },
  { id: 'registry', label: 'Registry', href: '/registry', glyph: '◇' },
  { id: 'settings', label: 'Settings', href: '/settings', glyph: '⚙' },
]

export const FOUNDER_CONTEXT: ContextNavItem[] = [
  { id: 'identity', label: 'Identity', href: '/founder?step=handle' },
  { id: 'companies', label: 'Companies', href: '/founder?step=organizations' },
  { id: 'products', label: 'Products', href: '/founder?step=products' },
  { id: 'experiences', label: 'Experiences', href: '/founder?step=experiences' },
  { id: 'review', label: 'Review', href: '/founder?step=review' },
]

export const COMPANION_CONTEXT: ContextNavItem[] = [
  { id: 'overview', label: 'Overview', href: '/companion#overview' },
  { id: 'memory', label: 'Memory', href: '/companion#memory' },
  { id: 'projects', label: 'Projects', href: '/companion#projects' },
  { id: 'agents', label: 'Agents', href: '/companion#agents' },
  { id: 'diagnostics', label: 'Diagnostics', href: '/companion#diagnostics' },
]

export const SETTINGS_CONTEXT: ContextNavItem[] = [
  { id: 'general', label: 'General', href: '/settings' },
  {
    id: 'command-center',
    label: 'Command Center',
    href: '/internal/command-center',
  },
  { id: 'status', label: 'Platform Status', href: '/internal/status' },
  { id: 'public-status', label: 'Public Status', href: '/status' },
]

export const FOUNDER_STEP_TO_CONTEXT: Record<string, FounderContextId> = {
  handle: 'identity',
  organizations: 'companies',
  products: 'products',
  experiences: 'experiences',
  review: 'review',
}

export const COMPANION_HASH_IDS: CompanionContextId[] = [
  'overview',
  'memory',
  'projects',
  'agents',
  'diagnostics',
]
