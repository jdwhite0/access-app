import type { BreadcrumbSegment } from './types'
import type { FounderContextId, PrimaryNavId } from './types'
import { FOUNDER_CONTEXT, PRIMARY_NAV } from './config'

const PRIMARY_LABEL: Record<PrimaryNavId, string> = {
  dashboard: 'Dashboard',
  terminal: 'Terminal',
  founder: 'Founder',
  companion: 'Companion',
  registry: 'Registry',
  settings: 'Settings',
}

export function buildBreadcrumbs(input: {
  primary: PrimaryNavId
  founderContext?: FounderContextId | null
  companionContext?: string | null
  settingsContextLabel?: string | null
  extraTail?: BreadcrumbSegment[]
}): BreadcrumbSegment[] {
  const trail: BreadcrumbSegment[] = [
    { label: 'ACCESS', href: '/dashboard' },
    {
      label: PRIMARY_LABEL[input.primary],
      href: PRIMARY_NAV.find((n) => n.id === input.primary)?.href,
    },
  ]

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
