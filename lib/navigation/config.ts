import type {
  CompanionContextId,
  ContextNavItem,
  FounderContextId,
  PrimaryNavItem,
} from './types'

/** Places, not tools — label + subtitle in primary rail */
export const PRIMARY_NAV: PrimaryNavItem[] = [
  { id: 'home',      label: 'HOME',      subtitle: 'Today',              href: '/dashboard', glyph: '▣' },
  { id: 'founder',   label: 'FOUNDER',   subtitle: 'Your Identity',      href: '/founder',   glyph: '◫' },
  { id: 'projects',  label: 'PROJECTS',  subtitle: "What You're Building",href: '/projects',  glyph: '▤' },
  { id: 'companion', label: 'COMPANION', subtitle: 'JYSON',              href: '/companion', glyph: '◎' },
  { id: 'agents',    label: 'AGENTS',    subtitle: 'Your Team',          href: '/agents',    glyph: '◉' },
  { id: 'memory',    label: 'MEMORY',    subtitle: 'Your Knowledge',     href: '/memory',    glyph: '◌' },
  { id: 'offers',    label: 'OFFERS',    subtitle: 'What You Sell',      href: '/offers',    glyph: '◈' },
  { id: 'registry',  label: 'REGISTRY',  subtitle: 'Your Universe',      href: '/registry',  glyph: '◇' },
  { id: 'settings',  label: 'SETTINGS',  subtitle: 'Preferences',        href: '/settings',  glyph: '⚙' },
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
  { id: 'general',        label: 'General',             href: '/settings' },
  { id: 'profile',        label: 'Profile',             href: '/settings/profile' },
  { id: 'account',        label: 'Account',             href: '/settings/account' },
  { id: 'billing',        label: 'Billing',             href: '/settings/billing' },
  { id: 'command-center', label: 'Command Center',      href: '/internal/command-center' },
  { id: 'status',         label: 'Platform Status',     href: '/internal/status' },
  { id: 'public-status',  label: 'Public Status',       href: '/status' },
  { id: 'terminal',       label: 'Terminal (advanced)', href: '/terminal' },
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
