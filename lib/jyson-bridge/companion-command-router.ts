import type { ToolId } from '@/lib/openjarvis-bridge/tool-registry'

export type CompanionCommandRoute =
  | {
      kind: 'execute'
      toolId: Extract<ToolId, 'read_file' | 'list_files'>
      params: Record<string, unknown>
      intent: string
    }
  | { kind: 'clarify'; message: string }
  | { kind: 'chat' }

const FILE_EXT = /\.[a-z0-9]{1,12}$/i
const QUOTED = /["'`]([^"'`]+)["'`]/

const MILESTONE_FILE_HINTS: Record<string, string> = {
  'milestone 10': 'docs/MILESTONE_10_COMPANION_EXECUTE_UI.md',
  'milestone 9': 'docs/MILESTONE_9_E2E_REPORT.md',
  'milestone 11': 'docs/MILESTONE_11_COMPANION_ORB_UI.md',
}

function extractQuoted(input: string): string | null {
  const m = input.match(QUOTED)
  return m?.[1]?.trim() ?? null
}

function extractPathToken(input: string): string | null {
  const quoted = extractQuoted(input)
  if (quoted) return quoted

  const backtick = input.match(/`([^`]+)`/)
  if (backtick?.[1]) return backtick[1].trim()

  const fileMatch = input.match(
    /(?:^|[\s(])([\w./-]+\.[a-z0-9]{1,12})(?:$|[\s),.;:!?])/i
  )
  if (fileMatch?.[1]) return fileMatch[1]

  const folderMatch = input.match(
    /(?:folder|directory|dir)\s+[`"']?([\w./-]+)[`"']?/i
  )
  if (folderMatch?.[1]) return folderMatch[1]

  const showFolder = input.match(/(?:show|list|open)\s+(?:me\s+)?(?:the\s+)?([\w./-]+)\s+folder/i)
  if (showFolder?.[1]) return showFolder[1]

  const inFolder = input.match(/\bin\s+(?:the\s+)?([\w./-]+)\s+folder/i)
  if (inFolder?.[1]) return inFolder[1]

  const bare = input.match(
    /(?:^|\s)(docs|lib|components|app|scripts|packages)(?:\s|$|[.,!?])/i
  )
  if (bare?.[1]) return bare[1]

  return null
}

function wantsList(input: string): boolean {
  const t = input.toLowerCase()
  if (/\b(list|ls|dir|browse|contents)\b/.test(t)) return true
  if (/show (me )?(the )?[\w./-]+ folder/.test(t)) return true
  if (/what'?s in/.test(t)) return true
  if (/\b(my )?files\b/.test(t) && !FILE_EXT.test(t)) return true
  if (/\bfolder\b/.test(t) && !FILE_EXT.test(t)) return true
  return false
}

function wantsRead(input: string): boolean {
  const t = input.toLowerCase()
  if (/\b(read|open|cat|view|display|show)\b/.test(t) && FILE_EXT.test(input)) return true
  if (/\b(read|open)\b/.test(t) && /\b(file|milestone|readme|package)\b/.test(t)) return true
  if (/\bthe\s+[\w\s-]+\s+file\b/.test(t)) return true
  return FILE_EXT.test(input) && !/\bfolder\b/i.test(t)
}

function resolveMilestonePath(input: string): string | null {
  const lower = input.toLowerCase()
  for (const [hint, path] of Object.entries(MILESTONE_FILE_HINTS)) {
    if (lower.includes(hint)) return path
  }
  return null
}

/**
 * Map natural-language companion commands to OpenJarvis file tools (read/list only).
 */
export function routeCompanionCommand(input: string): CompanionCommandRoute {
  const trimmed = input.trim()
  if (!trimmed) {
    return { kind: 'clarify', message: 'Tell me what to read or list — e.g. “read package.json” or “show the docs folder”.' }
  }

  const milestonePath = resolveMilestonePath(trimmed)
  if (milestonePath && wantsRead(trimmed)) {
    return {
      kind: 'execute',
      toolId: 'read_file',
      params: { path: milestonePath },
      intent: `Read ${milestonePath}`,
    }
  }

  const pathToken = extractPathToken(trimmed)

  if (wantsList(trimmed)) {
    const directory =
      pathToken ??
      (/\b(root|here|project|repo|my files)\b/i.test(trimmed) ? '.' : null)
    if (directory) {
      return {
        kind: 'execute',
        toolId: 'list_files',
        params: { directory },
        intent: `List ${directory === '.' ? 'project root' : directory}`,
      }
    }
    return {
      kind: 'clarify',
      message: 'Which folder should I list? Try “list the docs folder” or “list my files”.',
    }
  }

  if (wantsRead(trimmed)) {
    const path = milestonePath ?? pathToken
    if (path) {
      return {
        kind: 'execute',
        toolId: 'read_file',
        params: { path },
        intent: `Read ${path}`,
      }
    }
    return {
      kind: 'clarify',
      message: 'Which file should I read? Try “read package.json” or “read the milestone 10 file”.',
    }
  }

  if (pathToken && FILE_EXT.test(pathToken)) {
    return {
      kind: 'execute',
      toolId: 'read_file',
      params: { path: pathToken },
      intent: `Read ${pathToken}`,
    }
  }

  if (pathToken && !FILE_EXT.test(pathToken)) {
    return {
      kind: 'execute',
      toolId: 'list_files',
      params: { directory: pathToken },
      intent: `List ${pathToken}`,
    }
  }

  if (/\b(file|folder|read|list|open|docs|lib)\b/i.test(trimmed)) {
    return {
      kind: 'clarify',
      message:
        'Should I read a file or list a folder? Example: “read README.md” or “show me the docs folder”.',
    }
  }

  return { kind: 'chat' }
}
