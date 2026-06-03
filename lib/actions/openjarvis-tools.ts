'use server'

import { loadJysonContextForSession } from '@/lib/jyson-bridge/load-jyson-context'
import { resolveOpenJarvisRuntimeState } from '@/lib/openjarvis/resolve-runtime-state'
import {
  executeTool,
  getToolById,
  TOOL_REGISTRY,
  type ToolId,
} from '@/lib/openjarvis/load-bridge'

export async function listOpenJarvisTools() {
  const runtime = await resolveOpenJarvisRuntimeState()
  return {
    tools: TOOL_REGISTRY.map((t) => ({
      id: t.id,
      label: t.label,
      category: t.category,
      description: t.description,
      requiredAction: t.requiredAction,
      requiresConfirmation: t.requiresConfirmation,
      mutates: t.mutates,
      params: t.params,
    })),
    runtime,
  }
}

export async function executeOpenJarvisTool(input: {
  toolId: ToolId
  params: Record<string, unknown>
  userConfirmed?: boolean
}) {
  const { context, error } = await loadJysonContextForSession()
  if (!context) {
    return { success: false, error: error ?? 'Sign in to use local tools.' }
  }

  const runtime = await resolveOpenJarvisRuntimeState()
  if (!runtime.localToolsAvailable) {
    return {
      success: false,
      error:
        runtime.message ??
        'Local tools require PRIVATE_JYSON_ENABLED, an online ACCESS connector, and OpenJarvis.',
    }
  }

  const tool = getToolById(input.toolId)
  if (!tool) {
    return { success: false, error: `Unknown tool: ${input.toolId}` }
  }

  return executeTool(input.toolId, input.params, {
    allowedActions: context.allowedActions,
    handle: context.handle,
    founderOsPath: context.userSystemPackagePath,
    userConfirmed: input.userConfirmed,
    connectorOnline: runtime.connectorOnline,
  })
}
