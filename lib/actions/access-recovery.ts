'use server'

import {
  generateAccessWorld,
  refreshJysonCompanion,
} from '@/lib/actions/jyson-companion-repair'
import type { RecoveryActionId } from '@/lib/access/recovery-framework'
import type { CompanionLoadResult } from '@/lib/jyson-bridge/resolve-companion-world'

export type RecoveryExecuteResult = {
  ok: boolean
  message?: string
  companion?: CompanionLoadResult
  /** Client should navigate */
  navigateTo?: string
}

export async function executeRecoveryAction(
  actionId: RecoveryActionId
): Promise<RecoveryExecuteResult> {
  switch (actionId) {
    case 'retry_load':
    case 'open_companion': {
      const companion = await refreshJysonCompanion()
      return {
        ok: !!companion.context,
        message: companion.context
          ? 'JYSON is ready.'
          : companion.diagnostic?.message ?? 'Still loading — try again.',
        companion,
        navigateTo: companion.context ? '/companion' : undefined,
      }
    }
    case 'generate_world': {
      const companion = await generateAccessWorld()
      return {
        ok: !!companion.context,
        message: companion.repairMessage ?? companion.diagnostic?.message,
        companion,
      }
    }
    case 'complete_blueprint':
      return { ok: true, navigateTo: '/founder' }
    case 'go_vaults':
      return { ok: true, navigateTo: '/vaults' }
    case 'go_agents':
      return { ok: true, navigateTo: '/agents' }
    case 'sign_in':
      return { ok: true, navigateTo: '/' }
    case 'connect_device':
      return { ok: true, navigateTo: '/agents?connect=tools' }
    case 'sync_vault':
    case 'view_diagnostics':
      return { ok: true, message: 'Use the button on this page to continue.' }
    default:
      return { ok: false, message: 'Unknown action.' }
  }
}
