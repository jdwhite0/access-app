import type { FounderBlueprintSpec } from '@/types/founder-blueprint'
import type { AgentActionId, AccessUserType } from './agent-policy'

export interface VaultSeedSummary {
  id: string
  type: 'organization' | 'product' | 'experience'
  name: string
  path: string
}

export interface RegistrySnapshot {
  schema_version: string
  founder_handle: string
  founder_os_id: string
  source_blueprint_id: string
  organizations: Array<{ id: string; name: string } | string>
  products: Array<{
    id: string
    name?: string
    type?: string
    organization_id?: string
  }>
  experiences: Array<{
    id: string
    name?: string
    url?: string
    product_id?: string
  }>
  relationships?: Array<Record<string, string>>
}

/**
 * Everything attached to an ACCESS Handle (ownership anchor).
 * Serializable for JYSON and internal APIs.
 */
export interface AccessHandleContext {
  accessHandle: string
  ownershipAnchor: string
  identity: {
    displayName: string
    accessHandle: string
    userType: AccessUserType
  }
  blueprint: FounderBlueprintSpec
  registry: RegistrySnapshot | null
  vaultSeedSummaries: VaultSeedSummary[]
  organizations: FounderBlueprintSpec['organizations']
  products: FounderBlueprintSpec['products']
  experiences: FounderBlueprintSpec['experiences']
  userSystemId: string
  userSystemPackagePath: string | null
  allowedActions: AgentActionId[]
  deniedActions: AgentActionId[]
  summaries: {
    consumer: string
    technical: string
  }
  source: 'supabase' | 'fixture' | 'package' | 'default'
}
