import { readdir, stat } from 'node:fs/promises'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, relative, extname, basename, resolve } from 'node:path'
import type { AccessConnectorConfig, VaultFileMetadata, VaultScanSummary } from './types.js'

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
  /package-lock\.json$/,
]

const SCAN_ALLOWED_EXTENSIONS = new Set([
  '.md',
  '.json',
  '.yaml',
  '.yml',
  '.sql',
  '.ts',
  '.tsx',
  '.sh',
  '.html',
  '.css',
])

const DEFAULT_MAX_FILES = 5000

function shouldExcludeFile(name: string): boolean {
  return SCAN_EXCLUDE_FILE_PATTERNS.some((re) => re.test(name))
}

function isAllowedFile(name: string): boolean {
  const ext = extname(name).toLowerCase()
  if (!ext) return name === '_START_HERE.md' || name.endsWith('.md')
  return SCAN_ALLOWED_EXTENSIONS.has(ext)
}

export async function scanVaultMetadata(options: {
  vaultRoot: string
  vaultKey: string
  maxFiles?: number
}): Promise<VaultScanSummary> {
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES
  const files: VaultFileMetadata[] = []
  let skippedDirs = 0
  let totalBytes = 0
  const byExtension: Record<string, number> = {}
  const byTopLevel: Record<string, number> = {}

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
        if (SCAN_EXCLUDE_DIR_NAMES.has(entry.name)) {
          skippedDirs += 1
          continue
        }
        await walk(fullPath)
        continue
      }

      if (!entry.isFile()) continue
      if (shouldExcludeFile(entry.name)) continue
      if (!isAllowedFile(entry.name)) continue

      try {
        const info = await stat(fullPath)
        const rel = relative(options.vaultRoot, fullPath).replace(/\\/g, '/')
        const ext = extname(entry.name).toLowerCase() || '(none)'
        files.push({
          relativePath: rel,
          extension: ext,
          sizeBytes: info.size,
          modifiedAt: info.mtime.toISOString(),
          kind: 'file',
        })
        totalBytes += info.size
        byExtension[ext] = (byExtension[ext] ?? 0) + 1
        const top = rel.split('/')[0] ?? '(root)'
        byTopLevel[top] = (byTopLevel[top] ?? 0) + 1
      } catch {
        /* unreadable */
      }
    }
  }

  await walk(options.vaultRoot)

  return {
    scannedAt: new Date().toISOString(),
    vaultKey: options.vaultKey,
    vaultRootLabel: basename(options.vaultRoot),
    fileCount: files.length,
    totalBytes,
    byExtension,
    byTopLevel,
    files,
    truncated: files.length >= maxFiles,
    skippedDirs,
  }
}

export type ScanCommandReport = {
  mode: 'scan'
  ok: boolean
  error: string | null
  outputPath: string | null
  summary: {
    fileCount: number
    totalBytes: number
    truncated: boolean
    byTopLevel: Record<string, number>
  } | null
}

export async function runScan(
  config: AccessConnectorConfig,
  options?: { outPath?: string }
): Promise<ScanCommandReport> {
  const vaultRoot = process.env.ACCESS_VAULT_ROOT?.trim()
  if (!vaultRoot) {
    return {
      mode: 'scan',
      ok: false,
      error: 'ACCESS_VAULT_ROOT is not set. Export it locally — never commit paths.',
      outputPath: null,
      summary: null,
    }
  }

  const root = resolve(vaultRoot)
  const scan = await scanVaultMetadata({
    vaultRoot: root,
    vaultKey: config.vaultKey,
  })

  const outPath =
    options?.outPath ?? resolve(process.cwd(), 'vault-scan-report.json')

  const payload = {
    identityHandle: config.identityHandle,
    vaultKey: config.vaultKey,
    scan,
    note: 'Metadata only — no file bodies. Do not commit if sensitive.',
  }

  writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8')

  return {
    mode: 'scan',
    ok: true,
    error: null,
    outputPath: outPath,
    summary: {
      fileCount: scan.fileCount,
      totalBytes: scan.totalBytes,
      truncated: scan.truncated,
      byTopLevel: scan.byTopLevel,
    },
  }
}

export function loadScanReportFiles(reportPath: string): VaultFileMetadata[] {
  const raw = JSON.parse(readFileSync(reportPath, 'utf8')) as {
    scan?: { files?: VaultFileMetadata[] }
  }
  return raw.scan?.files ?? []
}
