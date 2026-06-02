export type PrimaryNavId =
  | 'dashboard'
  | 'terminal'
  | 'founder'
  | 'companion'
  | 'registry'
  | 'settings'

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
