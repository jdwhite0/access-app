import { readdir, stat } from 'node:fs/promises'
import { extname, join, relative, resolve } from 'node:path'

/** Extensions allowed for platform vault sync (UI contract). */
export const VAULT_SYNC_ALLOWED_EXTENSIONS = new Set(['.md', '.txt', '.json', '.csv'])

const SCAN_EXCLUDE_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  '.vercel',
  '.clerk',
  '.obsidian',
  '__pycache__',
  '.turbo',
  'coverage',
])

const SCAN_EXCLUDE_FILE_PATTERNS = [
  /^\.env/i,
  /\.pem$/i,
  /\.key$/i,
  /credentials/i,
  /secret/i,
  /\.DS_Store$/,
]

export type VaultLocalFileRecord = {
  relativePath: string
  extension: string
  sizeBytes: number
  modifiedAt: string
}

export type VaultLocalScanResult = {
  ok: boolean
  error: string | null
  vaultRoot: string
  fileCount: number
  files: VaultLocalFileRecord[]
  truncated: boolean
}

function shouldExcludeFile(name: string): boolean {
  return SCAN_EXCLUDE_FILE_PATTERNS.some((re) => re.test(name))
}

function isAllowedFile(name: string): boolean {
  const ext = extname(name).toLowerCase()
  return VAULT_SYNC_ALLOWED_EXTENSIONS.has(ext)
}

export async function scanVaultLocalPath(
  localPath: string,
  options?: { maxFiles?: number },
): Promise<VaultLocalScanResult> {
  const maxFiles = options?.maxFiles ?? 10_000
  const vaultRoot = resolve(localPath.trim())

  let rootStat
  try {
    rootStat = await stat(vaultRoot)
  } catch {
    return {
      ok: false,
      error: `Path not found or not readable: ${vaultRoot}`,
      vaultRoot,
      fileCount: 0,
      files: [],
      truncated: false,
    }
  }

  if (!rootStat.isDirectory()) {
    return {
      ok: false,
      error: 'Local path must be a directory',
      vaultRoot,
      fileCount: 0,
      files: [],
      truncated: false,
    }
  }

  const files: VaultLocalFileRecord[] = []

  async function walk(dir: string): Promise<void> {
    if (files.length >= maxFiles) return

    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (files.length >= maxFiles) break
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        if (SCAN_EXCLUDE_DIR_NAMES.has(entry.name)) continue
        await walk(fullPath)
        continue
      }

      if (!entry.isFile()) continue
      if (shouldExcludeFile(entry.name)) continue
      if (!isAllowedFile(entry.name)) continue

      try {
        const info = await stat(fullPath)
        const rel = relative(vaultRoot, fullPath).replace(/\\/g, '/')
        files.push({
          relativePath: rel,
          extension: extname(entry.name).toLowerCase(),
          sizeBytes: info.size,
          modifiedAt: info.mtime.toISOString(),
        })
      } catch {
        /* unreadable file */
      }
    }
  }

  await walk(vaultRoot)

  return {
    ok: true,
    error: null,
    vaultRoot,
    fileCount: files.length,
    files,
    truncated: files.length >= maxFiles,
  }
}
