/**
 * Mirrors access-agent-runtime policy (P6) for handle-bound context in ACCESS.
 * ACCESS owns canonical truth; JYSON consumes this view.
 */

export type AccessUserType =
  | 'consumer'
  | 'creator'
  | 'builder'
  | 'founder'
  | 'organization'
  | 'community'

export type AgentActionId =
  | 'read_blueprint'
  | 'read_registry'
  | 'read_vault_seeds'
  | 'summarize_system'
  | 'list_organizations'
  | 'list_products'
  | 'list_experiences'
  | 'export_blueprint_yaml'
  | 'materialize_user_system'
  | 'update_blueprint_draft'
  | 'route_to_jyson'
  | 'route_to_claude_code'
  | 'route_to_cursor'
  | 'mutate_schema'
  | 'delete_identity'
  | 'bypass_access_canonical_store'
  | 'invoke_llm'

const BASE: AgentActionId[] = [
  'read_blueprint',
  'read_registry',
  'read_vault_seeds',
  'summarize_system',
  'list_organizations',
  'list_products',
  'list_experiences',
]

const ADVANCED: AgentActionId[] = [
  'export_blueprint_yaml',
  'materialize_user_system',
  'update_blueprint_draft',
  'route_to_jyson',
  'route_to_claude_code',
  'route_to_cursor',
]

const DENIED: AgentActionId[] = [
  'mutate_schema',
  'delete_identity',
  'bypass_access_canonical_store',
  'invoke_llm',
]

export function inferUserTypeFromIds(founderOsId: string, blueprintId: string): AccessUserType {
  const id = `${founderOsId} ${blueprintId}`.toLowerCase()
  if (id.includes('founder-os') || id.includes('founder')) return 'founder'
  if (id.includes('org') || id.includes('company')) return 'organization'
  if (id.includes('creator')) return 'creator'
  if (id.includes('builder')) return 'builder'
  if (id.includes('community')) return 'community'
  return 'consumer'
}

export type ExecutionSurfaceId =
  | 'access'
  | 'jyson'
  | 'claude_code'
  | 'cursor'
  | 'local_files'
  | 'vault'
  | 'future_cloud'

export interface ExecutionSurface {
  id: ExecutionSurfaceId
  label: string
  description: string
  available: boolean
}

/** Mirrors P6 execution surfaces for JYSON dispatch (routing only). */
export function buildExecutionSurfaces(userType: AccessUserType): ExecutionSurface[] {
  const isAdvanced =
    userType === 'founder' || userType === 'builder' || userType === 'organization'

  return [
    {
      id: 'access',
      label: 'ACCESS',
      description: 'Identity, blueprint, and canonical system of record.',
      available: true,
    },
    {
      id: 'jyson',
      label: 'JYSON',
      description: 'Intelligent dispatch and routing inside ACCESS.',
      available: isAdvanced,
    },
    {
      id: 'claude_code',
      label: 'Claude Code',
      description: 'Future implementation surface (not executed in P10).',
      available: isAdvanced,
    },
    {
      id: 'cursor',
      label: 'Cursor',
      description: 'Future IDE execution surface (not executed in P10).',
      available: isAdvanced,
    },
    {
      id: 'local_files',
      label: 'Local files',
      description: 'Generated packages and exports.',
      available: true,
    },
    {
      id: 'vault',
      label: 'Vault',
      description: 'Obsidian / Command Vault knowledge seeds.',
      available: true,
    },
    {
      id: 'future_cloud',
      label: 'Cloud integrations',
      description: 'Future external integrations.',
      available: false,
    },
  ]
}

export function resolveActionsForUserType(userType: AccessUserType): {
  allowed: AgentActionId[]
  denied: AgentActionId[]
} {
  const allowed = [...BASE]
  if (
    userType === 'founder' ||
    userType === 'builder' ||
    userType === 'creator' ||
    userType === 'organization'
  ) {
    allowed.push(...ADVANCED)
  }
  const denied = [...DENIED]
  for (const a of ADVANCED) {
    if (!allowed.includes(a)) denied.push(a)
  }
  return { allowed, denied: [...new Set(denied)] }
}
