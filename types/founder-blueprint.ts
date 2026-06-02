export const FOUNDER_OS_BLUEPRINT_TYPE = 'founder_os' as const
export const FOUNDER_BLUEPRINT_SCHEMA_VERSION = '1.0.0-mvp' as const

export type FounderBlueprintStatus = 'draft' | 'exported' | 'materialized'
export type FounderBlueprintOrigination =
  | 'access_wizard'
  | 'jyson_import'
  | 'manual'
  | 'unknown'
export type FounderProductType = 'platform' | 'portfolio'

export interface FounderBlueprintMeta {
  origination: FounderBlueprintOrigination
  authority: 'canonical' | 'draft'
  draft: boolean
}

export interface FounderBlueprintSpec {
  schema_version: typeof FOUNDER_BLUEPRINT_SCHEMA_VERSION
  blueprint_id: string
  blueprint_version: number
  status: FounderBlueprintStatus
  exported_at?: string
  access_blueprint_id?: string
  meta?: FounderBlueprintMeta
  founder: {
    display_name: string
    access_handle: string
  }
  organizations: Array<{ id: string; name: string }>
  products: Array<{
    id: string
    name: string
    type: FounderProductType
    organization_id?: string
  }>
  experiences: Array<{
    id: string
    name: string
    url?: string
    product_id?: string
  }>
  output: {
    founder_os_id: string
    name: string
  }
}

export interface FounderOsBlueprintRow {
  id: string
  clerk_user_id: string
  owner_handle: string
  type: typeof FOUNDER_OS_BLUEPRINT_TYPE
  answers: FounderBlueprintSpec
  system_id: string | null
  created_at: string
}

export interface FounderBlueprintValidationResult {
  valid: boolean
  errors: string[]
}

export interface FounderBlueprintExportResult {
  yaml: string
  spec: FounderBlueprintSpec
  row: FounderOsBlueprintRow
}
