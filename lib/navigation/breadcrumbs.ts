import type { BreadcrumbSegment } from './types'
import type { FounderContextId, PrimaryNavId } from './types'
import { FOUNDER_CONTEXT, PRIMARY_NAV } from './config'

const PRIMARY_DESTINATION: Record<PrimaryNavId, string> = {
  home:         'Home',
  projects:     'Projects',
  companion:    'Intelligence',
  agents:       'Team',
  memory:       'Knowledge',
  offers:       'Offers',
  registry:     'Assets',
  settings:     'Platform',
  systems:      'Systems',
  assets:       'Assets',
  customers:    'Customers',
  intelligence: 'Intelligence',
  knowledge:    'Knowledge',
  team:         'Team',
  platform:     'Platform',
  admin:        'Admin',
  terminal:     'Terminal',
}

export function buildBreadcrumbs(input: {
  primary: PrimaryNavId | null
  pathname?: string
  founderContext?: FounderContextId | null
  companionContext?: string | null
  settingsContextLabel?: string | null
  extraTail?: BreadcrumbSegment[]
}): BreadcrumbSegment[] {
  const trail: BreadcrumbSegment[] = [{ label: 'ACCESS', href: '/dashboard' }]

  if (input.primary) {
    trail.push({
      label: PRIMARY_DESTINATION[input.primary],
      href: PRIMARY_NAV.find((n) => n.id === input.primary)?.href,
    })
  } else if (input.pathname?.startsWith('/founder')) {
    trail.push({ label: 'Founder blueprint', href: '/founder' })
  } else if (input.pathname?.startsWith('/settings/billing')) {
    trail.push({ label: 'Settings', href: '/settings' })
    trail.push({ label: 'Billing' })
  }

  if (input.pathname?.startsWith('/founder') && input.founderContext) {
    const ctx = FOUNDER_CONTEXT.find((c) => c.id === input.founderContext)
    if (ctx) trail.push({ label: ctx.label, href: ctx.href })
  }

  if (
    (input.primary === 'companion' || input.pathname?.startsWith('/companion')) &&
    input.companionContext
  ) {
    const label =
      input.companionContext.charAt(0).toUpperCase() + input.companionContext.slice(1)
    trail.push({
      label,
      href: `/companion#${input.companionContext}`,
    })
  }

  if (
    (input.primary === 'settings' || input.pathname?.startsWith('/settings')) &&
    input.settingsContextLabel &&
    !input.pathname?.startsWith('/settings/billing')
  ) {
    trail.push({ label: input.settingsContextLabel })
  }

  if (input.extraTail?.length) {
    trail.push(...input.extraTail)
  }

  return trail
}
