export type OsModuleId =
  | 'registry'
  | 'systems'
  | 'agents'
  | 'projects'
  | 'blueprints'
  | 'assets'
  | 'workflows'
  | 'vaults'
  | 'connections'
  | 'offers'

export type OsModuleConfig = {
  id: OsModuleId
  label: string
  glyph: string
  enabled: boolean
}

export const OS_MODULES: OsModuleConfig[] = [
  { id: 'registry', label: 'Registry', glyph: '◇', enabled: true },
  { id: 'systems', label: 'Systems', glyph: '◈', enabled: false },
  { id: 'agents', label: 'Agents', glyph: '◎', enabled: false },
  { id: 'projects', label: 'Projects', glyph: '▣', enabled: false },
  { id: 'blueprints', label: 'Blueprints', glyph: '◫', enabled: false },
  { id: 'assets', label: 'Assets', glyph: '◆', enabled: false },
  { id: 'workflows', label: 'Workflows', glyph: '⟡', enabled: false },
  { id: 'vaults', label: 'Vaults', glyph: '▤', enabled: false },
  { id: 'connections', label: 'Connections', glyph: '⬡', enabled: false },
  { id: 'offers', label: 'Offers', glyph: '◉', enabled: false },
]
