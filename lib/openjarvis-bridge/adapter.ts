/**
 * OpenJarvis Adapter (ACCESS copy — keep in sync with jyson/backend/openjarvis-bridge)
 */
import { checkToolPermission, buildNotAvailableMessage } from './permission-gate'
import type { GateContext } from './permission-gate'
import type { ToolId } from './tool-registry'
import { getToolById } from './tool-registry'

const OPENJARVIS_URL = process.env.OPENJARVIS_LOCAL_URL ?? 'http://localhost:8000'
const PRIVATE_ENABLED = process.env.PRIVATE_JYSON_ENABLED === 'true'

export interface ToolCallResult {
  success: boolean
  output?: unknown
  error?: string
  requiresConfirmation?: boolean
  confirmationPrompt?: string
}

export interface AdapterContext extends GateContext {
  handle: string
  founderOsPath: string | null
}

function buildAdapterContext(opts: {
  allowedActions: string[]
  handle: string
  founderOsPath: string | null
  connectorOnline: boolean
}): AdapterContext {
  const cloudMode = process.env.VERCEL === '1' || !opts.connectorOnline
  return {
    allowedActions: opts.allowedActions,
    connectorOnline: opts.connectorOnline && PRIVATE_ENABLED,
    cloudMode,
    handle: opts.handle,
    founderOsPath: opts.founderOsPath,
  }
}

async function callOpenJarvis(
  endpoint: string,
  params: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(`${OPENJARVIS_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) {
    throw new Error(`OpenJarvis responded ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

const TOOL_ENDPOINTS: Partial<Record<ToolId, string>> = {
  read_file: '/api/files/read',
  write_file: '/api/files/write',
  list_files: '/api/files/list',
  read_vault_note: '/api/vault/read',
  write_vault_note: '/api/vault/write',
  read_email: '/api/email/read',
  compose_email: '/api/email/compose',
  read_calendar: '/api/calendar/read',
  create_event: '/api/calendar/create',
  run_local_model: '/api/models/run',
  browser_open: '/api/browser/open',
}

export async function executeTool(
  toolId: ToolId,
  params: Record<string, unknown>,
  opts: {
    allowedActions: string[]
    handle: string
    founderOsPath: string | null
    userConfirmed?: boolean
    connectorOnline: boolean
  }
): Promise<ToolCallResult> {
  const ctx = buildAdapterContext(opts)
  const gate = checkToolPermission(toolId, ctx)

  if (!gate.allowed) {
    return {
      success: false,
      error: buildNotAvailableMessage(toolId, ctx),
    }
  }

  const tool = getToolById(toolId)
  if (!tool) {
    return { success: false, error: `Unknown tool: ${toolId}` }
  }

  if (gate.requiresConfirmation && !opts.userConfirmed) {
    return {
      success: false,
      requiresConfirmation: true,
      confirmationPrompt: `This action (${tool.label}) will make changes. Do you confirm?`,
    }
  }

  const endpoint = TOOL_ENDPOINTS[toolId]
  if (!endpoint) {
    return { success: false, error: `No endpoint mapped for tool: ${toolId}` }
  }

  try {
    const output = await callOpenJarvis(endpoint, {
      ...params,
      _jyson_handle: opts.handle,
      _jyson_founder_os_path: opts.founderOsPath,
    })
    return { success: true, output }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'OpenJarvis call failed.',
    }
  }
}

export async function checkOpenJarvisHealth(): Promise<{
  online: boolean
  version?: string
  error?: string
}> {
  if (!PRIVATE_ENABLED) {
    return { online: false, error: 'PRIVATE_JYSON_ENABLED is not set. Local tools are disabled.' }
  }
  try {
    const res = await fetch(`${OPENJARVIS_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return { online: false, error: `Health check failed: ${res.status}` }
    const data = (await res.json()) as { version?: string }
    return { online: true, version: data.version }
  } catch (err) {
    return {
      online: false,
      error: err instanceof Error ? err.message : 'Cannot reach OpenJarvis server.',
    }
  }
}
