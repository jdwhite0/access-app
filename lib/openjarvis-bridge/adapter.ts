/**
 * OpenJarvis Adapter (ACCESS copy — keep in sync with jyson/backend/openjarvis-bridge)
 *
 * Native contract (OpenJarvis 0.1.1):
 * - GET /health — liveness
 * - GET /v1/tools — tool catalog
 * - Tool execution — ToolRegistry via OPENJARVIS venv (no HTTP /api/files/* routes)
 */
import { checkToolPermission, buildNotAvailableMessage } from './permission-gate'
import type { GateContext } from './permission-gate'
import type { ToolId } from './tool-registry'
import { getToolById } from './tool-registry'
import { mapAccessToolToOpenJarvis } from './openjarvis-tool-map'
import { assertToolInCatalog, invokeOpenJarvisNativeTool } from './native-tool-invoke'
import { buildRuntimeCard, type OpenJarvisRuntimeCard } from './runtime-card'
import { formatOpenJarvisHealthError } from '@/lib/openjarvis/format-health-error'

const OPENJARVIS_URL = process.env.OPENJARVIS_LOCAL_URL ?? 'http://localhost:8000'

function isPrivateLayerActive(): boolean {
  return process.env.PRIVATE_JYSON_ENABLED === 'true' && process.env.VERCEL !== '1'
}

const NATIVE_MAPPED_TOOLS: ReadonlySet<ToolId> = new Set(['read_file', 'list_files'])

export interface ToolCallResult {
  success: boolean
  output?: unknown
  error?: string
  requiresConfirmation?: boolean
  confirmationPrompt?: string
  runtimeCard?: OpenJarvisRuntimeCard
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
  const cloudMode = process.env.VERCEL === '1'
  const localExecution =
    isPrivateLayerActive() && opts.connectorOnline
  return {
    allowedActions: opts.allowedActions,
    connectorOnline: localExecution,
    cloudMode,
    handle: opts.handle,
    founderOsPath: opts.founderOsPath,
  }
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
    const card = buildRuntimeCard({
      success: false,
      toolId,
      permission: gate,
      invokePath: 'ACCESS permission gate',
      error: buildNotAvailableMessage(toolId, ctx),
    })
    return {
      success: false,
      error: card.error,
      runtimeCard: card,
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

  if (!NATIVE_MAPPED_TOOLS.has(toolId)) {
    const card = buildRuntimeCard({
      success: false,
      toolId,
      permission: gate,
      invokePath: 'unmapped',
      error: `Tool "${toolId}" is not yet mapped to OpenJarvis native tools. See openjarvis-tool-map.ts.`,
    })
    return { success: false, error: card.error, runtimeCard: card }
  }

  const mapped = mapAccessToolToOpenJarvis(toolId, params, opts.founderOsPath)
  if ('error' in mapped) {
    const card = buildRuntimeCard({
      success: false,
      toolId,
      permission: gate,
      invokePath: 'ACCESS tool map',
      error: mapped.error,
    })
    return { success: false, error: mapped.error, runtimeCard: card }
  }

  const catalogErr = await assertToolInCatalog(mapped.openJarvisToolId)
  if (catalogErr) {
    const card = buildRuntimeCard({
      success: false,
      toolId,
      openJarvisToolId: mapped.openJarvisToolId,
      permission: gate,
      invokePath: 'GET /v1/tools',
      error: catalogErr,
    })
    return { success: false, error: catalogErr, runtimeCard: card }
  }

  try {
    const native = await invokeOpenJarvisNativeTool(mapped, opts.founderOsPath)
    const card = buildRuntimeCard({
      success: native.success,
      toolId,
      openJarvisToolId: mapped.openJarvisToolId,
      permission: gate,
      invokePath: 'GET /v1/tools + ToolRegistry (venv)',
      content: native.content,
      metadata: native.metadata,
      error: native.error,
    })
    return {
      success: native.success,
      output: card.output,
      error: native.error,
      runtimeCard: card,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OpenJarvis native invoke failed.'
    const card = buildRuntimeCard({
      success: false,
      toolId,
      openJarvisToolId: mapped.openJarvisToolId,
      permission: gate,
      invokePath: 'GET /v1/tools + ToolRegistry (venv)',
      error: message,
    })
    return { success: false, error: message, runtimeCard: card }
  }
}

export async function checkOpenJarvisHealth(): Promise<{
  online: boolean
  version?: string
  error?: string
}> {
  if (!isPrivateLayerActive()) {
    return { online: false, error: 'PRIVATE_JYSON_ENABLED is not set. Local tools are disabled.' }
  }
  try {
    const res = await fetch(`${OPENJARVIS_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) {
      return {
        online: false,
        error: `GET ${OPENJARVIS_URL}/health returned ${res.status}. Run: npm run openjarvis:serve`,
      }
    }
    const data = (await res.json()) as { status?: string; version?: string }
    if (data.status !== 'ok') {
      return {
        online: false,
        error: `OpenJarvis health status is "${data.status ?? 'unknown'}", expected "ok".`,
        version: data.version,
      }
    }
    return { online: true, version: data.version }
  } catch (err) {
    return {
      online: false,
      error: formatOpenJarvisHealthError(err),
    }
  }
}
