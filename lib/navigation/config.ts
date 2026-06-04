import type {
  CompanionContextId,
  ContextNavItem,
  FounderContextId,
  PrimaryNavItem,
} from './types'

/**
 * Primary navigation — outcome-based labels.
 * Rule: name what the user gets, not the underlying mechanism.
 * Benchmark: Stripe (Payments / Billing / Customers / Reports).
 */
export const PRIMARY_NAV: PrimaryNavItem[] = [
  { id: 'home',      label: 'Home',          subtitle: 'Dashboard & status',        href: '/dashboard',  glyph: '▣' },
  { id: 'projects',  label: 'Projects',      subtitle: 'What you\'re building',     href: '/projects',   glyph: '▤' },
  { id: 'companion', label: 'Intelligence',  subtitle: 'Ask, plan, and decide',     href: '/companion',  glyph: '◎' },
  { id: 'registry',  label: 'Systems',       subtitle: 'Infrastructure & records',  href: '/registry',   glyph: '◇' },
  { id: 'agents',    label: 'Automation',    subtitle: 'Agents & workflows',        href: '/agents',     glyph: '◉' },
  { id: 'offers',    label: 'Offers',        subtitle: 'Products & services',       href: '/offers',     glyph: '◈' },
  { id: 'settings',  label: 'Settings',      subtitle: 'Account & billing',         href: '/settings',   glyph: '⚙' },
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
  { id: 'memory', label: 'Knowledge', href: '/memory' },
  { id: 'projects', label: 'Projects', href: '/companion#projects' },
  { id: 'agents', label: 'Automation', href: '/companion#agents' },
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
