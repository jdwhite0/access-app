import type { RegistrySummary } from '@/types/db'

export type RegistryRowKey = keyof RegistrySummary['counts']

export const REGISTRY_STAT_KEYS: RegistryRowKey[] = [
  'systems',
  'agents',
  'projects',
  'blueprints',
]

export const REGISTRY_ROW_LABELS: Record<RegistryRowKey, string> = {
  systems: 'Systems',
  agents: 'Agents',
  projects: 'Projects',
  blueprints: 'Blueprints',
  assets: 'Assets',
  workflows: 'Workflows',
  vaults: 'Vaults',
  connections: 'Connections',
  offers: 'Offers',
}
