'use server'

import { loadJysonContextForSession } from '@/lib/jyson-bridge/load-jyson-context'
import type { CompanionDiagnostic } from '@/lib/jyson-bridge/companion-diagnostic'
import type { CompanionWorldDiagnostics } from '@/lib/jyson-bridge/companion-world-diagnostic'
import type { JysonContext } from '@/lib/jyson-bridge/types'

export async function fetchJysonCompanionContext(): Promise<{
  context: JysonContext | null
  error?: string
  diagnostic?: CompanionDiagnostic
  worldDiagnostics?: CompanionWorldDiagnostics
}> {
  try {
    return await loadJysonContextForSession()
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not load your ACCESS world.'
    return {
      context: null,
      error: message,
      diagnostic: {
        status: 'unknown_error',
        title: 'Your ACCESS world is not ready yet.',
        body: 'JYSON needs your Blueprint and ACCESS system package before it can load your world.',
        message,
        canRepair: true,
        repairAction: 'repair_connection',
        panelActions: ['retry_loading', 'view_diagnostics'],
        steps: ['Retry after restarting the dev server'],
      },
    }
  }
}
