/**
 * Companion state machine — canonical hybrid cloud+local model.
 *
 * Cloud (Supabase) is the source of truth for blueprint status and identity.
 * Local Founder OS is the operational AI brain and working environment.
 * JYSON bridges them: reads cloud first, upgrades to local when available.
 */

export type CompanionDiagnosticStatus =
  // ─── Auth / identity gates ─────────────────────────────────────────────────
  | 'auth_missing'             // not signed in
  | 'identity_missing'         // signed in, no ACCESS identity row
  // ─── Blueprint gates ───────────────────────────────────────────────────────
  | 'blueprint_missing'        // no blueprint row in Supabase
  | 'blueprint_draft'          // blueprint exists but not yet exported
  // ─── Cloud package states ─────────────────────────────────────────────────
  | 'cloud_package_ready'      // blueprint exported/materialized — companion loads from cloud
  | 'local_sync_pending'       // cloud ready, local filesystem not available
  // ─── Local Founder OS states ──────────────────────────────────────────────
  | 'local_founder_os_ready'   // local package on disk — full local context available
  | 'companion_ready'          // cloud + local agent context fully loaded
  // ─── Error / offline states ───────────────────────────────────────────────
  | 'connector_offline'        // registered connector device not heartbeating
  | 'sync_error'               // cloud<>local sync failure (missing files in local package)
  | 'unknown_error'            // catch-all

export type CompanionRepairAction =
  | 'sign_in'
  | 'build_access_world'
  | 'repair_connection'
  | 'refresh_jyson'
  | 'open_wizard'

export type CompanionPanelAction =
  | 'complete_blueprint'
  | 'export_blueprint'
  | 'generate_access_world'
  | 'retry_loading'
  | 'view_diagnostics'

export interface CompanionDiagnostic {
  status: CompanionDiagnosticStatus
  message: string
  canRepair: boolean
  repairAction: CompanionRepairAction
  /** Plain-language title for repair panel */
  title: string
  body: string
  steps: string[]
  /** User-facing recovery panel actions */
  panelActions: CompanionPanelAction[]
  /** Whether blueprint is exported/materialized in cloud */
  cloudReady: boolean
  /** Whether local Founder OS package exists on filesystem */
  localReady: boolean
  /** Whether local connector device is online */
  connectorOnline: boolean
  missingStep?: string
  recommendedFix?: string
  handle?: string
  founderOsId?: string
  packagePath?: string | null
  agentContextLoaded?: boolean
}

const RECOVERY_TITLE = 'Your ACCESS world is not ready yet.'
const RECOVERY_BODY =
  'JYSON needs your Blueprint and ACCESS system package before it can load your world.'

function panelActionsFor(status: CompanionDiagnosticStatus): CompanionPanelAction[] {
  switch (status) {
    case 'blueprint_missing':
    case 'identity_missing':
      return ['complete_blueprint', 'retry_loading', 'view_diagnostics']
    case 'blueprint_draft':
      return ['export_blueprint', 'complete_blueprint', 'retry_loading', 'view_diagnostics']
    case 'cloud_package_ready':
    case 'local_sync_pending':
      return ['retry_loading', 'view_diagnostics']
    case 'local_founder_os_ready':
    case 'companion_ready':
      return ['retry_loading', 'view_diagnostics']
    case 'sync_error':
      return ['retry_loading', 'view_diagnostics']
    case 'connector_offline':
      return ['retry_loading', 'view_diagnostics']
    case 'auth_missing':
      return ['retry_loading']
    default:
      return ['complete_blueprint', 'generate_access_world', 'retry_loading', 'view_diagnostics']
  }
}

export function diagnosticForStatus(
  status: CompanionDiagnosticStatus,
  detail?: {
    handle?: string
    founderOsId?: string
    packagePath?: string | null
    error?: string
    cloudReady?: boolean
    localReady?: boolean
    connectorOnline?: boolean
  }
): CompanionDiagnostic {
  const handle = detail?.handle
  const founderOsId = detail?.founderOsId
  const packagePath = detail?.packagePath
  const cloudReady = detail?.cloudReady ?? false
  const localReady = detail?.localReady ?? false
  const connectorOnline = detail?.connectorOnline ?? false

  switch (status) {
    case 'companion_ready':
      return {
        status,
        title: 'Your ACCESS world is connected',
        body: 'JYSON is reading your identity, blueprint, and system package.',
        message: 'World loaded.',
        canRepair: false,
        repairAction: 'refresh_jyson',
        panelActions: [],
        cloudReady: true,
        localReady: true,
        connectorOnline,
        steps: [],
        handle,
        founderOsId,
        packagePath,
        agentContextLoaded: true,
      }

    case 'local_founder_os_ready':
      return {
        status,
        title: 'Local Founder OS connected',
        body: 'JYSON is reading from your local Founder OS. Agent context is loading.',
        message: 'Local Founder OS ready. Agent context optional.',
        canRepair: false,
        repairAction: 'refresh_jyson',
        panelActions: ['retry_loading', 'view_diagnostics'],
        cloudReady: true,
        localReady: true,
        connectorOnline,
        steps: [],
        handle,
        founderOsId,
        packagePath,
      }

    case 'cloud_package_ready':
      return {
        status,
        title: 'Cloud package ready',
        body: 'Your Founder OS package is ready in the ACCESS cloud. JYSON is loading your world.',
        message: 'Cloud package loaded. Local Founder OS not yet synced.',
        canRepair: false,
        repairAction: 'refresh_jyson',
        panelActions: ['retry_loading', 'view_diagnostics'],
        cloudReady: true,
        localReady: false,
        connectorOnline: false,
        steps: [],
        handle,
        founderOsId,
        packagePath,
      }

    case 'local_sync_pending':
      return {
        status,
        title: 'Cloud ready — local sync optional',
        body: 'JYSON can chat from your cloud vault and blueprint. Local folder sync is optional and runs on a Mac or PC.',
        message: 'Cloud package ready — local sync pending.',
        canRepair: false,
        repairAction: 'refresh_jyson',
        panelActions: ['retry_loading', 'view_diagnostics'],
        cloudReady: true,
        localReady: false,
        connectorOnline: false,
        steps: [],
        handle,
        founderOsId,
        packagePath,
      }

    case 'blueprint_draft':
      return {
        status,
        title: RECOVERY_TITLE,
        body: `${RECOVERY_BODY} Your blueprint is saved but not yet exported.`,
        message: 'Blueprint is in draft. Export to activate your Founder OS.',
        canRepair: true,
        repairAction: 'open_wizard',
        panelActions: panelActionsFor(status),
        cloudReady: false,
        localReady: false,
        connectorOnline: false,
        steps: ['Export your Founder Blueprint', 'Generate your Founder OS package', 'Companion unlocks'],
        handle,
        founderOsId,
      }

    case 'blueprint_missing':
      return {
        status,
        title: RECOVERY_TITLE,
        body: `${RECOVERY_BODY} No Founder Blueprint found in ACCESS.`,
        message: 'Founder Blueprint not found.',
        canRepair: true,
        repairAction: 'open_wizard',
        panelActions: panelActionsFor(status),
        cloudReady: false,
        localReady: false,
        connectorOnline: false,
        steps: ['Create your Founder Blueprint', 'Export your blueprint', 'Generate Founder OS package'],
        handle,
        founderOsId,
      }

    case 'identity_missing':
      return {
        status,
        title: RECOVERY_TITLE,
        body: `${RECOVERY_BODY} Your ACCESS identity has not been claimed.`,
        message: 'ACCESS identity not found for this account.',
        canRepair: true,
        repairAction: 'build_access_world',
        panelActions: panelActionsFor(status),
        cloudReady: false,
        localReady: false,
        connectorOnline: false,
        steps: ['Claim your ACCESS handle', 'Create Founder Blueprint', 'Generate Founder OS package'],
        handle,
      }

    case 'sync_error':
      return {
        status,
        title: 'Local sync error',
        body: 'Your cloud package is ready but the local Founder OS folder has missing files.',
        message: detail?.error ?? 'Local Founder OS package is incomplete.',
        canRepair: true,
        repairAction: 'repair_connection',
        panelActions: panelActionsFor(status),
        cloudReady: true,
        localReady: false,
        connectorOnline,
        steps: ['Regenerate Founder OS package', 'Restore missing files', 'Reload JYSON'],
        handle,
        founderOsId,
        packagePath,
      }

    case 'connector_offline':
      return {
        status,
        title: 'Local connector offline',
        body: 'Your Founder OS is ready in the cloud but your local connector is not running.',
        message: 'Local connector offline.',
        canRepair: true,
        repairAction: 'repair_connection',
        panelActions: panelActionsFor(status),
        cloudReady: true,
        localReady: false,
        connectorOnline: false,
        steps: ['Start local ACCESS connector', 'Sync Founder OS folder', 'Reconnect JYSON'],
        handle,
        founderOsId,
        packagePath,
      }

    case 'auth_missing':
      return {
        status,
        title: 'Sign in required',
        body: 'ACCESS needs your identity before JYSON can load your digital world.',
        message: 'Sign in to load your ACCESS world.',
        canRepair: false,
        repairAction: 'sign_in',
        panelActions: panelActionsFor(status),
        cloudReady: false,
        localReady: false,
        connectorOnline: false,
        steps: ['Sign in to ACCESS'],
      }

    default:
      return {
        status: 'unknown_error',
        title: RECOVERY_TITLE,
        body: detail?.error ? `${RECOVERY_BODY} ${detail.error}` : RECOVERY_BODY,
        message: detail?.error ?? 'Unknown error.',
        canRepair: true,
        repairAction: 'repair_connection',
        panelActions: panelActionsFor('unknown_error'),
        cloudReady,
        localReady,
        connectorOnline,
        steps: ['Diagnose connection', 'Repair package', 'Refresh JYSON'],
        handle,
        founderOsId,
        packagePath,
      }
  }
}
