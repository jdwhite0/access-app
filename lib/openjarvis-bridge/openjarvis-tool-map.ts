import type { ToolId } from './tool-registry'
import {
  resolveAccessToolRoot,
  resolveUnderToolRoot,
} from './path-resolve'

export type OpenJarvisNativeToolId = string

export type MappedNativeTool = {
  openJarvisToolId: OpenJarvisNativeToolId
  params: Record<string, unknown>
  mapping: 'direct' | 'shell_exec_list'
}

const BLOCKED_SHELL = /[;&|`$(){}<>]/

export function mapAccessToolToOpenJarvis(
  toolId: ToolId,
  params: Record<string, unknown>,
  founderOsPath: string | null
): MappedNativeTool | { error: string } {
  const rootResult = resolveAccessToolRoot(founderOsPath)
  if (typeof rootResult !== 'string') {
    return { error: rootResult.error }
  }
  const base = rootResult

  if (toolId === 'read_file') {
    const rel = String(params.path ?? '').trim()
    if (!rel) return { error: 'path is required' }
    const resolved = resolveUnderToolRoot(base, rel)
    if ('error' in resolved) return { error: resolved.error }
    return {
      openJarvisToolId: 'file_read',
      params: { path: resolved.absolute },
      mapping: 'direct',
    }
  }

  if (toolId === 'list_files') {
    const dir = String(params.directory ?? '.').trim() || '.'
    if (BLOCKED_SHELL.test(dir)) {
      return { error: 'directory contains blocked characters' }
    }
    const resolved = resolveUnderToolRoot(base, dir)
    if ('error' in resolved) return { error: resolved.error }
    return {
      openJarvisToolId: 'shell_exec',
      params: {
        command: 'ls -la',
        working_dir: resolved.absolute,
        timeout: 30,
      },
      mapping: 'shell_exec_list',
    }
  }

  return { error: `Native mapping not implemented for tool: ${toolId}` }
}
