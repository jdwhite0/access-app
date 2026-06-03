export type PrimaryNavId =
  | 'home'
  | 'projects'
  | 'companion'
  | 'memory'
  | 'agents'
  | 'offers'
  | 'registry'
  | 'settings'

/** Routes linked from Settings — not primary rail */
export type WorkspaceRouteId = 'founder'

/** Advanced / auth landing — not shown in primary rail */
export type InternalNavId = 'terminal' | 'billing'

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
