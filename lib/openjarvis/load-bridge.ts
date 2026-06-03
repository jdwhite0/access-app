export {
  executeTool,
  checkOpenJarvisHealth,
  type ToolCallResult,
} from '@/lib/openjarvis-bridge/adapter'
export type { OpenJarvisRuntimeCard } from '@/lib/openjarvis-bridge/runtime-card'
export { mapAccessToolToOpenJarvis } from '@/lib/openjarvis-bridge/openjarvis-tool-map'
export {
  TOOL_REGISTRY,
  getToolById,
  type ToolId,
  type ToolDefinition,
} from '@/lib/openjarvis-bridge/tool-registry'
export {
  checkToolPermission,
  buildNotAvailableMessage,
  type GateContext,
} from '@/lib/openjarvis-bridge/permission-gate'

export function isPrivateJysonEnabled(): boolean {
  return process.env.PRIVATE_JYSON_ENABLED === 'true' && process.env.VERCEL !== '1'
}
