import type {
  CompanionContextId,
  ContextNavItem,
  FounderContextId,
  PrimaryNavItem,
} from './types'

/** V5 primary navigation — understandable in 5 seconds */
export const PRIMARY_NAV: PrimaryNavItem[] = [
  { id: 'home',      label: 'Home',     subtitle: 'Today',                 href: '/dashboard',  glyph: '▣' },
  { id: 'projects',  label: 'Projects', subtitle: "What you're building",  href: '/projects',   glyph: '▤' },
  { id: 'companion', label: 'JYSON',    subtitle: 'Your AI companion',     href: '/companion',  glyph: '◎' },
  { id: 'memory',    label: 'Memory',   subtitle: 'What JYSON remembers',  href: '/memory',     glyph: '◌' },
  { id: 'agents',    label: 'Agents',   subtitle: 'Your AI team',          href: '/agents',     glyph: '◉' },
  { id: 'offers',    label: 'Offers',   subtitle: 'What you sell',         href: '/offers',     glyph: '◈' },
  { id: 'registry',  label: 'Registry', subtitle: 'System records',        href: '/registry',   glyph: '◇' },
  { id: 'settings',  label: 'Settings', subtitle: 'Account and tools',     href: '/settings',   glyph: '⚙' },
]

export const WORKSPACE_LINKS = [
  {
    label: 'Founder blueprint',
    href: '/founder',
    note: 'Identity, companies, products, and experiences for JYSON',
  },
] as const

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
  { id: 'diagnostics', label: 'Local tools', href: '/companion#diagnostics' },
]

export const SETTINGS_CONTEXT: ContextNavItem[] = [
  { id: 'general', label: 'Overview', href: '/settings' },
  { id: 'profile', label: 'Profile', href: '/settings/profile' },
  { id: 'account', label: 'Account', href: '/settings/account' },
  { id: 'billing', label: 'Billing', href: '/settings/billing' },
  { id: 'terminal', label: 'Terminal', href: '/terminal' },
  { id: 'command-center', label: 'Command Center', href: '/internal/command-center' },
  { id: 'status', label: 'Platform status', href: '/internal/status' },
  { id: 'public-status', label: 'Public status', href: '/status' },
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
