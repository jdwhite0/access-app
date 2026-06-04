import { watch } from 'node:fs'
import type { AccessConnectorConfig } from './types.js'
import { runVaultMirror } from './vault-mirror.js'
import { resolveMonorepoRoot } from './vault-mirror-paths.js'
import {
  shouldExcludeMirrorDir,
  shouldExcludeMirrorFile,
} from './vault-mirror-ignore.js'

const DEFAULT_DEBOUNCE_MS = 2000

export type VaultMirrorWatchReport = {
  mode: 'vault-mirror-watch'
  ok: boolean
  error: string | null
  monorepoRoot: string
  debounceMs: number
}

function shouldIgnoreWatchPath(watchedRoot: string, absPath: string): boolean {
  const rel = absPath.startsWith(watchedRoot)
    ? absPath.slice(watchedRoot.length + 1)
    : absPath
  const segments = rel.split(/[/\\]/).filter(Boolean)
  for (const seg of segments) {
    if (shouldExcludeMirrorDir(seg)) return true
  }
  const fileName = segments[segments.length - 1] ?? ''
  if (fileName && shouldExcludeMirrorFile(fileName)) return true
  if (rel.includes('/system_mirror/') || rel.startsWith('system_mirror/')) return true
  if (rel.includes('JD Command Vault/system_mirror')) return true
  return false
}

export async function runVaultMirrorWatch(
  config: AccessConnectorConfig,
  options?: { debounceMs?: number; monorepoRoot?: string },
): Promise<VaultMirrorWatchReport> {
  const monorepoRoot = resolveMonorepoRoot(options?.monorepoRoot)
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let running = false

  const scheduleMirror = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      if (running) {
        scheduleMirror()
        return
      }
      running = true
      try {
        const report = await runVaultMirror(config)
        console.log(
          JSON.stringify(
            {
              event: 'mirror_complete',
              ok: report.ok,
              notesWritten: report.notesWritten,
              error: report.error,
            },
            null,
            2,
          ),
        )
      } catch (err) {
        console.error(
          JSON.stringify({
            event: 'mirror_error',
            error: err instanceof Error ? err.message : String(err),
          }),
        )
      } finally {
        running = false
      }
    }, debounceMs)
  }

  return new Promise((resolvePromise) => {
    try {
      const watcher = watch(
        monorepoRoot,
        { recursive: true },
        (_event, filename) => {
          if (!filename) return
          const abs = `${monorepoRoot}/${filename}`
          if (shouldIgnoreWatchPath(monorepoRoot, abs)) return
          scheduleMirror()
        },
      )

      console.log(
        JSON.stringify(
          {
            event: 'watch_started',
            monorepoRoot,
            debounceMs,
            hint: 'Ctrl+C to stop',
          },
          null,
          2,
        ),
      )

      scheduleMirror()

      watcher.on('error', (err) => {
        resolvePromise({
          mode: 'vault-mirror-watch',
          ok: false,
          error: err.message,
          monorepoRoot,
          debounceMs,
        })
      })

      process.on('SIGINT', () => {
        watcher.close()
        resolvePromise({
          mode: 'vault-mirror-watch',
          ok: true,
          error: null,
          monorepoRoot,
          debounceMs,
        })
        process.exit(0)
      })
    } catch (err) {
      resolvePromise({
        mode: 'vault-mirror-watch',
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        monorepoRoot,
        debounceMs,
      })
    }
  })
}
