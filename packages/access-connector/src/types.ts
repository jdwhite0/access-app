/** Committed config — no secrets, no absolute paths in repo. */
export interface AccessConnectorConfig {
  vaultKey: string
  identityHandle: string
  displayName?: string
  machineId?: string
  compileProfile?: string
}

export const DEFAULT_VAULT_KEY = 'JD_AI_System'

export type VaultFileMetadata = {
  relativePath: string
  extension: string
  sizeBytes: number
  modifiedAt: string
  kind: 'file'
}

export type VaultScanSummary = {
  scannedAt: string
  vaultKey: string
  vaultRootLabel: string
  fileCount: number
  totalBytes: number
  byExtension: Record<string, number>
  byTopLevel: Record<string, number>
  files: VaultFileMetadata[]
  truncated: boolean
  skippedDirs: number
}

export type RegistryObjectType =
  | 'system'
  | 'project'
  | 'agent'
  | 'blueprint'
  | 'workflow'
  | 'asset'
  | 'offer'
  | 'skip'

export type PlannedRegistryRow = {
  objectType: RegistryObjectType
  action: 'would_upsert' | 'skip'
  name: string
  sourcePath: string
  sourceRef: string
  sourceKind: 'vault_import'
  contentHash?: string
  reason: string
}

export type RegistrySyncPlan = {
  mode: 'sync-plan'
  generatedAt: string
  identityHandle: string
  vaultKey: string
  applyToCloud: false
  planned: PlannedRegistryRow[]
  counts: Record<RegistryObjectType, number>
}

export type CompileSummary = {
  mode: 'compile'
  compiledAt: string
  identityHandle: string
  vaultKey: string
  candidates: {
    systems: number
    projects: number
    agents: number
    blueprints: number
    workflows: number
    assets: number
    offers: number
    skipped: number
  }
  topCandidates: PlannedRegistryRow[]
}
