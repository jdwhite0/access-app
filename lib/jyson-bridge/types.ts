/** Mirror of jyson JysonContext for ACCESS server actions (read-only). */

export interface JysonCompanionState {
  /** Current companion tier in the hybrid model */
  status: string
  /** Blueprint is exported/materialized in cloud — companion can load */
  cloudReady: boolean
  /** Local Founder OS package exists on filesystem */
  localConnected: boolean
  /** Local ACCESS connector device is heartbeating */
  connectorOnline: boolean
}

export interface JysonContext {
  handle: string
  identity: {
    displayName: string
    accessHandle: string
    userType: string
  }
  organizations: Array<{ id: string; name: string }>
  products: Array<{
    id: string
    name: string
    type: string
    organization_id?: string
  }>
  experiences: Array<{
    id: string
    name: string
    url: string
    product_id?: string
  }>
  registry: Record<string, unknown> | null
  vaultSeeds: Array<{
    id: string
    type: string
    name: string
    path: string
  }>
  permissions: { allowed: string[]; denied: string[] }
  allowedActions: string[]
  deniedActions: string[]
  summary: { consumer: string; technical: string; headline: string }
  userSystemId: string
  userSystemPackagePath: string | null
  layers: { accessHandleContext: boolean; agentContext: boolean }
  /** Hybrid model state — cloud vs local tier */
  companionState: JysonCompanionState
}
