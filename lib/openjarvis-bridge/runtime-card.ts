import type { ToolId } from './tool-registry'
import type { GateResult } from './permission-gate'

export type OpenJarvisRuntimeCard = {
  success: boolean
  toolId: ToolId
  openJarvisToolId?: string
  invokePath: string
  permission: GateResult
  output?: unknown
  content?: string
  error?: string
  metadata?: Record<string, unknown>
}

export function buildRuntimeCard(input: {
  success: boolean
  toolId: ToolId
  permission: GateResult
  openJarvisToolId?: string
  invokePath: string
  content?: string
  metadata?: Record<string, unknown>
  error?: string
}): OpenJarvisRuntimeCard {
  return {
    success: input.success,
    toolId: input.toolId,
    openJarvisToolId: input.openJarvisToolId,
    invokePath: input.invokePath,
    permission: input.permission,
    content: input.content,
    output: input.success
      ? { content: input.content, metadata: input.metadata }
      : undefined,
    error: input.error,
    metadata: input.metadata,
  }
}
