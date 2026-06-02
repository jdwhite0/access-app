/** Mirror of jyson JysonContext for ACCESS server actions (read-only). */

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
}
