import type { BreadcrumbSegment } from './types'
import type { FounderContextId, PrimaryNavId } from './types'
import { FOUNDER_CONTEXT, PRIMARY_NAV } from './config'

/** Destination language for breadcrumbs (place names, not tool names) */
const PRIMARY_DESTINATION: Record<PrimaryNavId, string> = {
  home: 'Home',
  founder: 'Your Identity',
  projects: "What You're Building",
  companion: 'JYSON',
  agents: 'Your Team',
  memory: 'Your Knowledge',
  offers: 'What You Sell',
  registry: 'Your Universe',
  settings: 'Preferences',
}

export function buildBreadcrumbs(input: {
  primary: PrimaryNavId | null
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
  }

  if (input.primary === 'founder' && input.founderContext) {
    const ctx = FOUNDER_CONTEXT.find((c) => c.id === input.founderContext)
    if (ctx) trail.push({ label: ctx.label, href: ctx.href })
  }

  if (input.primary === 'companion' && input.companionContext) {
    const label =
      input.companionContext.charAt(0).toUpperCase() +
      input.companionContext.slice(1)
    trail.push({
      label,
      href: `/companion#${input.companionContext}`,
    })
  }

  if (input.primary === 'settings' && input.settingsContextLabel) {
    trail.push({ label: input.settingsContextLabel })
  }

  if (input.extraTail?.length) {
    trail.push(...input.extraTail)
  }

  return trail
}
