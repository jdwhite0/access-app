import type {
  CompanionContextId,
  ContextNavItem,
  FounderContextId,
  PrimaryNavItem,
} from './types'

/**
 * Primary navigation — grouped, outcome-based labels.
 * Rule: name what the user gets, not the mechanism.
 * Benchmark: Stripe (Payments / Billing / Customers / Reports).
 *
 * Groups: main | intelligence | platform | founder
 * Founder-only items are hidden for non-founder plans.
 */
export const PRIMARY_NAV: PrimaryNavItem[] = [
  // ── Main ──────────────────────────────────────────────────────────────────
  { id: 'home',         label: 'Home',           subtitle: 'Today\'s focus',           href: '/dashboard',   glyph: '▣', group: 'main' },
  { id: 'projects',     label: 'Projects',       subtitle: 'What you\'re building',    href: '/projects',    glyph: '▤', group: 'main' },
  { id: 'systems',      label: 'Systems',        subtitle: 'How work runs',            href: '/systems',     glyph: '◇', group: 'main' },
  { id: 'assets',       label: 'Assets',         subtitle: 'What you own',             href: '/assets',      glyph: '▣', group: 'main' },
  { id: 'customers',    label: 'Customers',      subtitle: 'Who you serve',            href: '/customers',   glyph: '◉', group: 'main' },
  { id: 'offers',       label: 'Offers',         subtitle: 'What you sell',            href: '/offers',      glyph: '◈', group: 'main' },
  // ── Intelligence ──────────────────────────────────────────────────────────
  { id: 'intelligence', label: 'Intelligence',   subtitle: 'Ask JYSON',                href: '/companion',   glyph: '◎', group: 'intelligence' },
  { id: 'knowledge',    label: 'Knowledge',      subtitle: 'Memory and context',       href: '/memory',      glyph: '◌', group: 'intelligence' },
  { id: 'team',         label: 'Team',           subtitle: 'Your AI team',             href: '/agents',      glyph: '⬡', group: 'intelligence' },
  // ── Platform ──────────────────────────────────────────────────────────────
  { id: 'platform',     label: 'Platform',       subtitle: 'Your workspace',           href: '/settings',    glyph: '⚙', group: 'platform' },
  // ── Founder only ──────────────────────────────────────────────────────────
  { id: 'admin',        label: 'Admin',          subtitle: 'Platform overview',        href: '/admin',       glyph: '◈', group: 'founder', founderOnly: true },
  { id: 'terminal',     label: 'Terminal',       subtitle: 'Command surface',          href: '/terminal',    glyph: '▶', group: 'founder', founderOnly: true },
]

export const NAV_GROUP_LABELS: Record<string, string> = {
  main:         'Main',
  intelligence: 'Intelligence',
  platform:     'Platform',
  founder:      'Founder',
}

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
