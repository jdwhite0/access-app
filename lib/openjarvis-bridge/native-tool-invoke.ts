import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { MappedNativeTool } from './openjarvis-tool-map'

const OPENJARVIS_URL = process.env.OPENJARVIS_LOCAL_URL ?? 'http://localhost:8000'

export type OpenJarvisCatalogTool = {
  name: string
  description?: string
  category?: string
}

export type NativeInvokeResult = {
  success: boolean
  content?: string
  metadata?: Record<string, unknown>
  error?: string
}

export async function fetchOpenJarvisToolCatalog(): Promise<{
  tools: OpenJarvisCatalogTool[]
  error?: string
}> {
  try {
    const res = await fetch(`${OPENJARVIS_URL}/v1/tools`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      return { tools: [], error: `GET /v1/tools failed: ${res.status}` }
    }
    const data = (await res.json()) as { tools?: OpenJarvisCatalogTool[] }
    return { tools: data.tools ?? [] }
  } catch (err) {
    return {
      tools: [],
      error: err instanceof Error ? err.message : 'GET /v1/tools unreachable',
    }
  }
}

export async function assertToolInCatalog(openJarvisToolId: string): Promise<string | null> {
  const { tools, error } = await fetchOpenJarvisToolCatalog()
  if (error) return error
  if (!tools.some((t) => t.name === openJarvisToolId)) {
    return `Tool "${openJarvisToolId}" not in OpenJarvis GET /v1/tools catalog`
  }
  return null
}

function resolvePythonBin(): string {
  const fromEnv = process.env.OPENJARVIS_PYTHON?.trim()
  if (fromEnv && existsSync(fromEnv)) return fromEnv
  const home = process.env.HOME ?? ''
  const venvPython = join(home, '.openjarvis', '.venv', 'bin', 'python')
  if (existsSync(venvPython)) return venvPython
  return 'python3'
}

function resolveInvokeScript(): string {
  return join(process.cwd(), 'scripts', 'openjarvis-invoke-tool.py')
}

export function invokeOpenJarvisNativeTool(
  mapped: MappedNativeTool,
  founderOsPath: string | null
): Promise<NativeInvokeResult> {
  const python = resolvePythonBin()
  const script = resolveInvokeScript()
  const allowedDirs = founderOsPath ? [founderOsPath] : []

  const payload = JSON.stringify({
    tool: mapped.openJarvisToolId,
    params: mapped.params,
    allowed_dirs: allowedDirs,
  })

  return new Promise((resolve) => {
    const child = spawn(python, [script], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      resolve({ success: false, error: 'OpenJarvis native invoke timed out (30s)' })
    }, 30_000)

    child.on('close', (code) => {
      clearTimeout(timer)
      if (!stdout.trim()) {
        resolve({
          success: false,
          error: stderr.trim() || `Native invoke exited ${code ?? 'unknown'}`,
        })
        return
      }
      try {
        const parsed = JSON.parse(stdout) as NativeInvokeResult & { tool_name?: string }
        resolve({
          success: parsed.success,
          content: parsed.content,
          metadata: {
            ...(parsed.metadata ?? {}),
            openJarvisToolId: mapped.openJarvisToolId,
            mapping: mapped.mapping,
            invokePath: 'GET /v1/tools + ToolRegistry (venv)',
          },
          error: parsed.success ? undefined : parsed.content ?? 'Tool failed',
        })
      } catch {
        resolve({
          success: false,
          error: `Invalid invoke JSON: ${stdout.slice(0, 200)}`,
        })
      }
    })

    child.stdin.write(payload)
    child.stdin.end()
  })
}
