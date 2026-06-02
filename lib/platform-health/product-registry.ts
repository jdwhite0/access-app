import type { PlatformProductId } from './status-types'

export type ProductDefinition = {
  id: PlatformProductId
  displayName: string
  description: string
  /** Host repo or deploy surface (documentation only). */
  deploySurfaces: string[]
}

export const PRODUCT_REGISTRY: Record<PlatformProductId, ProductDefinition> = {
  access_os: {
    id: 'access_os',
    displayName: 'ACCESS OS',
    description: 'Identity, registry, connector, and Founder OS gateway.',
    deploySurfaces: ['access-app', 'Vercel project app'],
  },
  jyson: {
    id: 'jyson',
    displayName: 'JYSON',
    description: 'Command and companion runtime for operator workflows.',
    deploySurfaces: ['jyson', 'jyson-runtime', 'jyson.vercel.app'],
  },
  build: {
    id: 'build',
    displayName: 'Build',
    description: 'Builder projects, offers, and delivery pipelines.',
    deploySurfaces: ['builder app', 'registry builder_projects'],
  },
  vault: {
    id: 'vault',
    displayName: 'Vault',
    description: 'Intelligence Vault filesystem and metadata doctrine.',
    deploySurfaces: ['JD Command Vault', 'JD_Ai_System monorepo'],
  },
  jd_ai_systems_core: {
    id: 'jd_ai_systems_core',
    displayName: 'JD AI Systems Core',
    description: 'Shared platform services consumed by all products.',
    deploySurfaces: ['monorepo', 'command_center', 'platform-health'],
  },
}

export function getProduct(id: PlatformProductId): ProductDefinition {
  return PRODUCT_REGISTRY[id]
}

export function listProducts(): ProductDefinition[] {
  return Object.values(PRODUCT_REGISTRY)
}
