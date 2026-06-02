export type CompanionDiagnosticStatus =
  | 'ready'
  | 'auth_missing'
  | 'missing_identity'
  | 'missing_blueprint'
  | 'missing_founder_os'
  | 'missing_manifest'
  | 'missing_registry'
  | 'missing_agent_context'
  | 'unknown_error'

export type CompanionRepairAction =
  | 'sign_in'
  | 'build_access_world'
  | 'repair_connection'
  | 'refresh_jyson'
  | 'open_wizard'

export type CompanionPanelAction =
  | 'complete_blueprint'
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
    case 'missing_blueprint':
    case 'missing_identity':
      return ['complete_blueprint', 'generate_access_world', 'retry_loading', 'view_diagnostics']
    case 'missing_founder_os':
    case 'missing_manifest':
    case 'missing_registry':
      return ['generate_access_world', 'retry_loading', 'view_diagnostics']
    case 'missing_agent_context':
      return ['generate_access_world', 'retry_loading', 'view_diagnostics']
    case 'auth_missing':
      return ['retry_loading', 'view_diagnostics']
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
  }
): CompanionDiagnostic {
  const handle = detail?.handle
  const founderOsId = detail?.founderOsId
  const packagePath = detail?.packagePath

  switch (status) {
    case 'ready':
      return {
        status,
        title: 'Your ACCESS world is connected',
        body: 'JYSON can read your identity, blueprint, and system package.',
        message: 'World loaded.',
        canRepair: false,
        repairAction: 'refresh_jyson',
        panelActions: [],
        steps: [],
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
        panelActions: panelActionsFor('auth_missing'),
        steps: ['Clerk session', 'ACCESS identity'],
      }
    case 'missing_identity':
      return {
        status,
        title: RECOVERY_TITLE,
        body: `${RECOVERY_BODY} Missing: ACCESS identity for your Clerk account.`,
        message: 'ACCESS identity not found for this account.',
        canRepair: true,
        repairAction: 'build_access_world',
        panelActions: panelActionsFor(status),
        steps: ['Create ACCESS identity', 'Attach Founder Blueprint', 'Generate Founder OS package'],
        handle,
      }
    case 'missing_blueprint':
      return {
        status,
        title: RECOVERY_TITLE,
        body: `${RECOVERY_BODY} Missing: canonical Blueprint row in ACCESS.`,
        message: 'Founder Blueprint not found.',
        canRepair: true,
        repairAction: 'open_wizard',
        panelActions: panelActionsFor(status),
        steps: ['Create default Founder Blueprint', 'Generate Founder OS package', 'Connect runtime'],
        handle,
        founderOsId,
      }
    case 'missing_founder_os':
      return {
        status,
        title: RECOVERY_TITLE,
        body: `${RECOVERY_BODY} Missing: generated Founder OS package${founderOsId ? ` (${founderOsId})` : ''}.`,
        message: 'Founder OS package not generated.',
        canRepair: true,
        repairAction: 'build_access_world',
        panelActions: panelActionsFor(status),
        steps: ['Validate blueprint', 'Materialize Founder OS', 'Load AgentContext'],
        handle,
        founderOsId,
        packagePath,
      }
    case 'missing_manifest':
      return {
        status,
        title: RECOVERY_TITLE,
        body: `${RECOVERY_BODY} Package folder exists but manifest.json is missing.`,
        message: 'manifest.json missing in Founder OS package.',
        canRepair: true,
        repairAction: 'repair_connection',
        panelActions: panelActionsFor(status),
        steps: ['Regenerate Founder OS package', 'Restore manifest.json', 'Reload JYSON'],
        handle,
        founderOsId,
        packagePath,
      }
    case 'missing_registry':
      return {
        status,
        title: RECOVERY_TITLE,
        body: `${RECOVERY_BODY} Package is incomplete — registry.yaml is missing.`,
        message: 'registry.yaml missing in Founder OS package.',
        canRepair: true,
        repairAction: 'repair_connection',
        panelActions: panelActionsFor(status),
        steps: ['Regenerate Founder OS package', 'Restore registry.yaml', 'Reload JYSON'],
        handle,
        founderOsId,
        packagePath,
      }
    case 'missing_agent_context':
      return {
        status,
        title: RECOVERY_TITLE,
        body: `${RECOVERY_BODY} Package found but AgentContext failed to load.`,
        message: detail?.error ?? 'AgentContext failed to load.',
        canRepair: true,
        repairAction: 'repair_connection',
        panelActions: ['generate_access_world', 'retry_loading', 'view_diagnostics'],
        steps: ['Repair Founder OS package', 'Reload AgentContext', 'Refresh JYSON'],
        handle,
        founderOsId,
        packagePath,
        agentContextLoaded: false,
      }
    default:
      return {
        status: 'unknown_error',
        title: RECOVERY_TITLE,
        body: detail?.error
          ? `${RECOVERY_BODY} ${detail.error}`
          : RECOVERY_BODY,
        message: detail?.error ?? 'Unknown error.',
        canRepair: true,
        repairAction: 'repair_connection',
        panelActions: panelActionsFor('unknown_error'),
        steps: ['Diagnose connection', 'Repair package', 'Refresh JYSON'],
        handle,
        founderOsId,
        packagePath,
      }
  }
}
