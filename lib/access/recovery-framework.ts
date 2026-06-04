/**
 * ACCESS recovery framework — account function vs user operations.
 * Used by UI + JYSON to route corrections when work is blocked.
 */

export type AccountFunctionArea =
  | 'auth'
  | 'identity'
  | 'blueprint'
  | 'vault_cloud'
  | 'package'

export type UserOperationArea =
  | 'companion_chat'
  | 'vault_sync'
  | 'local_bridge'
  | 'agents_tools'

export type RecoveryLayer = 'account' | 'operation'

export type RecoveryActionId =
  | 'retry_load'
  | 'open_companion'
  | 'complete_blueprint'
  | 'generate_world'
  | 'sync_vault'
  | 'go_vaults'
  | 'go_agents'
  | 'sign_in'
  | 'view_diagnostics'
  | 'connect_device'

export type RecoveryActionKind = 'primary' | 'secondary' | 'link'

export type RecoveryAction = {
  id: RecoveryActionId
  label: string
  kind: RecoveryActionKind
  href?: string
  /** Prompt sent to JYSON when user chooses “fix with AI” */
  jysonPrompt?: string
  desktopOnly?: boolean
}

export type RecoveryChoice = {
  id: string
  label: string
  hint?: string
  /** Runs this action when selected */
  actionId: RecoveryActionId
}

export type RecoveryQuestion = {
  prompt: string
  choices: RecoveryChoice[]
}

export type RecoveryPlan = {
  layer: RecoveryLayer
  accountArea?: AccountFunctionArea
  operationArea?: UserOperationArea
  blockerCode: string
  title: string
  body: string
  /** JYSON may auto-run retry_load / open_companion on mount */
  jysonCanAutoFix: boolean
  jysonPrompt: string
  actions: RecoveryAction[]
  question?: RecoveryQuestion
  technicalDetail?: string
}

export const JYSON_FIX_PREFIX =
  'I am blocked in ACCESS. Help me fix this and get back to work: '
