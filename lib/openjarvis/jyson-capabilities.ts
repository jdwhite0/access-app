import type { IntelligenceCapabilities, IntelligenceSessionContext } from '@/lib/openjarvis/runtime-capabilities'
import type { OpenJarvisRuntimeState } from '@/lib/openjarvis/resolve-runtime-state'

/** User-facing JYSON capability ids (not OpenJarvis tool names). */
export type JysonCapabilityId =
  | 'local_file_intelligence'
  | 'vault_intelligence'
  | 'local_action_layer'
  | 'calendar_context'
  | 'local_model_runtime'

export type JysonCapabilityStatus = 'online' | 'offline' | 'planned'

export type JysonCapabilityUiTone = 'operational' | 'neutral' | 'offline'

export type JysonCapabilityCard = {
  id: JysonCapabilityId
  title: string
  description: string
}

export type JysonCapabilityUiStatus = {
  status: JysonCapabilityStatus
  label: string
  tone: JysonCapabilityUiTone
}

/** Mapped OpenJarvis tools — infrastructure only; never shown in ACCESS UI. */
const LIVE_FILE_TOOLS = ['read_file', 'list_files'] as const
const PLANNED_NATIVE_TOOLS = [
  'read_vault_note',
  'run_local_model',
  'read_calendar',
] as const

export const JYSON_CAPABILITY_CARDS: readonly JysonCapabilityCard[] = [
  {
    id: 'local_file_intelligence',
    title: 'Local File Intelligence',
    description:
      'Read and browse files on this Mac when private JYSON, the connector, and the local runtime are active.',
  },
  {
    id: 'vault_intelligence',
    title: 'Vault Intelligence',
    description:
      'Answer from your Command Vault — cloud excerpts when indexed, deeper note access with private JYSON on this Mac.',
  },
  {
    id: 'local_action_layer',
    title: 'Local Action Layer',
    description:
      'Run approved local commands and scripts through JYSON when this execution layer is enabled.',
  },
  {
    id: 'calendar_context',
    title: 'Calendar Context',
    description: 'Bring schedule and timing into JYSON answers from your calendar on this Mac.',
  },
  {
    id: 'local_model_runtime',
    title: 'Local Model Runtime',
    description: 'Route selected prompts to an on-device model for offline or sensitive work.',
  },
] as const

export type JysonCapabilitySnapshot = Record<JysonCapabilityId, JysonCapabilityStatus>

function capabilityLabel(status: JysonCapabilityStatus): string {
  if (status === 'online') return 'Online'
  if (status === 'offline') return 'Offline'
  return 'Planned'
}

function capabilityTone(status: JysonCapabilityStatus): JysonCapabilityUiTone {
  if (status === 'online') return 'operational'
  if (status === 'offline') return 'offline'
  return 'neutral'
}

export function resolveJysonCapabilityStatus(
  id: JysonCapabilityId,
  runtime: OpenJarvisRuntimeState | null,
  capabilities: IntelligenceCapabilities | null = null,
  session: IntelligenceSessionContext = {},
): JysonCapabilityUiStatus {
  const vaultCloudReady = session.vaultCloudReady !== false
  const vaultChat = capabilities?.vaultChat ?? vaultCloudReady

  let status: JysonCapabilityStatus

  switch (id) {
    case 'local_file_intelligence':
      status = runtime?.localToolsAvailable ? 'online' : 'offline'
      break
    case 'vault_intelligence':
      if (vaultChat || runtime?.privateLayerEnabled) {
        status = 'online'
      } else {
        status = 'offline'
      }
      break
    case 'local_action_layer':
    case 'calendar_context':
    case 'local_model_runtime':
      status = 'planned'
      break
    default:
      status = 'planned'
  }

  return {
    status,
    label: capabilityLabel(status),
    tone: capabilityTone(status),
  }
}

export function resolveJysonCapabilitySnapshot(
  runtime: OpenJarvisRuntimeState | null,
  capabilities: IntelligenceCapabilities | null = null,
  session: IntelligenceSessionContext = {},
): JysonCapabilitySnapshot {
  return Object.fromEntries(
    JYSON_CAPABILITY_CARDS.map((card) => [
      card.id,
      resolveJysonCapabilityStatus(card.id, runtime, capabilities, session).status,
    ]),
  ) as JysonCapabilitySnapshot
}

/** @deprecated Use JYSON capability cards — kept for tests and dev tooling. */
export const OPENJARVIS_MAPPED_TOOL_IDS = LIVE_FILE_TOOLS

/** @deprecated Internal tool ids only. */
export const OPENJARVIS_DISPLAY_TOOL_IDS = [
  ...LIVE_FILE_TOOLS,
  ...PLANNED_NATIVE_TOOLS,
] as const

/** @deprecated Map raw tool id to legacy chip status. */
export function openJarvisToolUiStatus(
  toolId: string,
  runtime: OpenJarvisRuntimeState | null,
): { label: string; tone: 'operational' | 'neutral' } {
  if (!runtime?.localToolsAvailable) {
    return { label: 'Offline', tone: 'neutral' }
  }
  if ((LIVE_FILE_TOOLS as readonly string[]).includes(toolId)) {
    return { label: 'Ready', tone: 'operational' }
  }
  return { label: 'Planned', tone: 'neutral' }
}
