/**
 * OpenJarvis Permission Gate (ACCESS copy — keep in sync with jyson/backend/openjarvis-bridge)
 */
import type { ToolId } from './tool-registry'
import { getToolById } from './tool-registry'

export interface GateContext {
  allowedActions: string[]
  connectorOnline: boolean
  cloudMode: boolean
}

export interface GateResult {
  allowed: boolean
  reason: string
  requiresConfirmation: boolean
}

export function checkToolPermission(toolId: ToolId, ctx: GateContext): GateResult {
  if (ctx.cloudMode || !ctx.connectorOnline) {
    return {
      allowed: false,
      reason: 'Local connector is offline. This tool requires your machine to be connected to ACCESS.',
      requiresConfirmation: false,
    }
  }

  const tool = getToolById(toolId)
  if (!tool) {
    return {
      allowed: false,
      reason: `Unknown tool: ${toolId}`,
      requiresConfirmation: false,
    }
  }

  const hasAction = ctx.allowedActions.includes(tool.requiredAction)
  if (!hasAction) {
    return {
      allowed: false,
      reason: `Your ACCESS identity does not have permission for "${tool.requiredAction}". This tool is restricted.`,
      requiresConfirmation: false,
    }
  }

  return {
    allowed: true,
    reason: `Permitted by ACCESS policy (action: ${tool.requiredAction})`,
    requiresConfirmation: tool.requiresConfirmation,
  }
}

export function buildNotAvailableMessage(toolId: ToolId, ctx: GateContext): string {
  const tool = getToolById(toolId)
  const label = tool?.label ?? toolId

  if (ctx.cloudMode || !ctx.connectorOnline) {
    return `"${label}" requires your local machine to be connected to ACCESS. Start the ACCESS connector to enable local tools.`
  }
  return `"${label}" is not available with your current ACCESS permissions.`
}
