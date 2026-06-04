export type {
  AccessConnectorConfig,
  VaultFileMetadata,
  VaultScanSummary,
  RegistrySyncPlan,
  PlannedRegistryRow,
  CompileSummary,
} from './types.js'
export { DEFAULT_VAULT_KEY } from './types.js'
export {
  loadConnectorConfig,
  loadEnvFromAccessApp,
  validateConnectorConfig,
} from './config.js'
export { scanVaultMetadata, runScan, loadScanReportFiles } from './scan.js'
export { buildRegistrySyncPlan, runSyncPlan } from './sync-plan.js'
export { compileFromScanReport, runCompile } from './compile.js'
export { runVaultMirror } from './vault-mirror.js'
export { runVaultMirrorWatch } from './vault-mirror-watch.js'
export { runPostMirrorVaultResync } from './vault-mirror-resync.js'
export {
  resolveMonorepoRoot,
  resolveVaultPath,
  resolveSystemMirrorDir,
  DEFAULT_MONOREPO_ROOT,
  DEFAULT_VAULT_PATH,
} from './vault-mirror-paths.js'
