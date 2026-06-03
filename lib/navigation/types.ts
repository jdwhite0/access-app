export type PrimaryNavId =
  | 'home'
  | 'founder'
  | 'projects'
  | 'companion'
  | 'agents'
  | 'memory'
  | 'offers'
  | 'registry'
  | 'settings'

/** Advanced / auth landing — not shown in primary rail */
export type InternalNavId = 'terminal'

export type FounderContextId =
  | 'identity'
  | 'companies'
  | 'products'
  | 'experiences'
  | 'review'

export type CompanionContextId =
  | 'overview'
  | 'memory'
  | 'projects'
  | 'agents'
  | 'diagnostics'

export type PrimaryNavItem = {
  id: PrimaryNavId
  label: string
  subtitle: string
  href: string
  glyph: string
}

export type ContextNavItem = {
  id: string
  label: string
  href: string
}

export type BreadcrumbSegment = {
  label: string
  href?: string
}
