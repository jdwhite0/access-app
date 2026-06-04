import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import {
  VAULT_SYNC_ALLOWED_EXTENSIONS,
  type VaultLocalFileRecord,
  scanVaultLocalPath,
} from '@/lib/vault/scan-local-path'

/** ~500 tokens at ~4 chars/token */
export const VAULT_CHUNK_TARGET_CHARS = 2000
export const VAULT_CHUNK_OVERLAP_CHARS = 200
export const VAULT_MAX_FILE_BYTES = 512_000
export const VAULT_MAX_CHUNKS_INJECTED = 8
export const VAULT_MAX_INJECT_CHARS = 14_000

export type VaultContentChunk = {
  id: string
  relativePath: string
  chunkIndex: number
  text: string
}

export type VaultContentIndexManifest = {
  version: 1
  vaultRoot: string
  indexedAt: string
  fileCount: number
  chunkCount: number
  truncatedScan: boolean
}

export type VaultContentIndex = {
  manifest: VaultContentIndexManifest
  chunks: VaultContentChunk[]
}

export type VaultIndexBuildResult = {
  ok: boolean
  error: string | null
  indexPath: string
  manifest: VaultContentIndexManifest | null
}

function accessAppRoot(): string {
  return process.cwd()
}

export function vaultIndexDirForRoot(vaultRoot: string): string {
  const slug = createHash('sha256').update(resolve(vaultRoot)).digest('hex').slice(0, 16)
  return join(accessAppRoot(), '.jyson-vault-index', slug)
}

export function vaultIndexFilePath(vaultRoot: string): string {
  return join(vaultIndexDirForRoot(vaultRoot), 'index.json')
}

function chunkId(relativePath: string, chunkIndex: number): string {
  return createHash('sha1')
    .update(`${relativePath}#${chunkIndex}`)
    .digest('hex')
    .slice(0, 12)
}

function splitIntoChunks(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  if (normalized.length <= VAULT_CHUNK_TARGET_CHARS) {
    return [normalized]
  }

  const paragraphs = normalized.split(/\n{2,}/)
  const chunks: string[] = []
  let current = ''

  function flushWithOverlap() {
    if (!current.trim()) return
    chunks.push(current.trim())
    const tail = current.slice(-VAULT_CHUNK_OVERLAP_CHARS)
    current = tail
  }

  for (const para of paragraphs) {
    const piece = para.trim()
    if (!piece) continue

    if (piece.length > VAULT_CHUNK_TARGET_CHARS) {
      if (current.trim()) flushWithOverlap()
      let start = 0
      while (start < piece.length) {
        const end = Math.min(start + VAULT_CHUNK_TARGET_CHARS, piece.length)
        chunks.push(piece.slice(start, end).trim())
        start = end - VAULT_CHUNK_OVERLAP_CHARS
        if (start < 0) start = 0
        if (end >= piece.length) break
      }
      current = ''
      continue
    }

    const next = current ? `${current}\n\n${piece}` : piece
    if (next.length <= VAULT_CHUNK_TARGET_CHARS) {
      current = next
    } else {
      flushWithOverlap()
      current = piece
    }
  }

  if (current.trim()) chunks.push(current.trim())
  return chunks
}

async function readVaultFileContent(
  vaultRoot: string,
  file: VaultLocalFileRecord,
): Promise<string | null> {
  const fullPath = join(vaultRoot, file.relativePath)
  try {
    const info = await stat(fullPath)
    if (!info.isFile() || info.size > VAULT_MAX_FILE_BYTES) return null
    const raw = await readFile(fullPath, 'utf8')
    const ext = file.extension
    if (ext === '.json' || ext === '.csv') {
      return raw.length > VAULT_CHUNK_TARGET_CHARS * 2
        ? `${raw.slice(0, VAULT_CHUNK_TARGET_CHARS * 2)}\n… [truncated]`
        : raw
    }
    return raw
  } catch {
    return null
  }
}

export async function buildVaultContentIndex(
  vaultRoot: string,
  options?: { maxFiles?: number },
): Promise<VaultIndexBuildResult> {
  const root = resolve(vaultRoot.trim())
  const indexPath = vaultIndexFilePath(root)

  const scan = await scanVaultLocalPath(root, { maxFiles: options?.maxFiles ?? 10_000 })
  if (!scan.ok) {
    return { ok: false, error: scan.error, indexPath, manifest: null }
  }

  const chunks: VaultContentChunk[] = []

  for (const file of scan.files) {
    if (!VAULT_SYNC_ALLOWED_EXTENSIONS.has(file.extension)) continue
    const content = await readVaultFileContent(root, file)
    if (!content?.trim()) continue

    const parts = splitIntoChunks(content)
    parts.forEach((text, chunkIndex) => {
      chunks.push({
        id: chunkId(file.relativePath, chunkIndex),
        relativePath: file.relativePath,
        chunkIndex,
        text,
      })
    })
  }

  const manifest: VaultContentIndexManifest = {
    version: 1,
    vaultRoot: root,
    indexedAt: new Date().toISOString(),
    fileCount: scan.fileCount,
    chunkCount: chunks.length,
    truncatedScan: scan.truncated,
  }

  const payload: VaultContentIndex = { manifest, chunks }
  const dir = vaultIndexDirForRoot(root)
  await mkdir(dir, { recursive: true })
  await writeFile(indexPath, JSON.stringify(payload), 'utf8')

  return { ok: true, error: null, indexPath, manifest }
}

export async function loadVaultContentIndex(
  vaultRoot: string,
): Promise<VaultContentIndex | null> {
  const indexPath = vaultIndexFilePath(vaultRoot)
  try {
    const raw = await readFile(indexPath, 'utf8')
    const parsed = JSON.parse(raw) as VaultContentIndex
    if (parsed?.manifest?.version !== 1 || !Array.isArray(parsed.chunks)) return null
    return parsed
  } catch {
    return null
  }
}

function tokenizeQuery(query: string): string[] {
  return [...new Set(
    query
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length >= 3),
  )]
}

export function scoreVaultChunks(
  chunks: VaultContentChunk[],
  query: string,
): Array<VaultContentChunk & { score: number }> {
  const words = tokenizeQuery(query)
  if (words.length === 0) return []

  return chunks
    .map((chunk) => {
      const text = chunk.text.toLowerCase()
      const path = chunk.relativePath.toLowerCase()
      let score = 0
      for (const w of words) {
        if (path.includes(w)) score += 4
        const matches = text.match(new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'))
        score += matches?.length ?? 0
      }
      if (path.includes('brain/') || path.includes('daily/')) score += 2
      if (path.includes('priorities') || path.includes('today.md')) score += 3
      return { ...chunk, score }
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
}

export function selectVaultChunksForQuery(
  index: VaultContentIndex,
  query: string,
  options?: { maxChunks?: number; maxChars?: number },
): VaultContentChunk[] {
  const maxChunks = options?.maxChunks ?? VAULT_MAX_CHUNKS_INJECTED
  const maxChars = options?.maxChars ?? VAULT_MAX_INJECT_CHARS

  const ranked = scoreVaultChunks(index.chunks, query)
  const selected: VaultContentChunk[] = []
  let used = 0

  for (const row of ranked) {
    if (selected.length >= maxChunks) break
    const add = row.text.length + row.relativePath.length + 40
    if (used + add > maxChars && selected.length > 0) break
    selected.push({
      id: row.id,
      relativePath: row.relativePath,
      chunkIndex: row.chunkIndex,
      text: row.text,
    })
    used += add
  }

  if (selected.length > 0) return selected

  // Cold query — surface high-signal defaults
  const defaults = [
    'daily/today.md',
    'brain/priorities.md',
    'brain/identity.md',
    'brain/business.md',
    'AGENT_BOOT.md',
  ]
  for (const rel of defaults) {
    const hit = index.chunks.find((c) => c.relativePath === rel || c.relativePath.endsWith(rel))
    if (hit && !selected.some((s) => s.id === hit.id)) {
      selected.push(hit)
      if (selected.length >= 3) break
    }
  }

  return selected
}

export function formatVaultContextBlock(input: {
  vaultRoot: string
  chunks: VaultContentChunk[]
  indexedAt: string
  query: string
}): string {
  if (input.chunks.length === 0) {
    return `
[JYSON VAULT CONTENT — no matching excerpts]
Vault path: ${input.vaultRoot}
Index built: ${input.indexedAt}
Query focus: ${input.query.slice(0, 200)}

No indexed excerpts matched this question. Tell the user clearly:
- Vault intelligence is on, but nothing in the index matched.
- Suggest \`npm run jyson:vault:index\` from access-app if the index is missing or stale.
- For priorities/today, mention checking \`daily/today.md\` and \`brain/priorities.md\` on disk.
Do not invent vault facts. Do not output a DISCOVERY REPORT for this turn.
[END JYSON VAULT CONTENT]`.trim()
  }

  const body = input.chunks
    .map(
      (c, i) =>
        `### Excerpt ${i + 1}: ${c.relativePath} (chunk ${c.chunkIndex})\n${c.text}`,
    )
    .join('\n\n')

  return `
[JYSON VAULT CONTENT — grounded excerpts from JD Command Vault]
Vault path: ${input.vaultRoot}
Index built: ${input.indexedAt}
Query focus: ${input.query.slice(0, 200)}

These excerpt bodies are the authoritative vault read for this turn — use the markdown text below, not folder guesses.
Answer when the user asks about notes, strategy, priorities, projects, or vault files. Cite paths like \`brain/priorities.md\` when relevant.
Do not say connector offline blocks reading when these excerpts are present.

${body}
[END JYSON VAULT CONTENT]`.trim()
}

export async function retrieveVaultContextForQuery(
  vaultRoot: string,
  query: string,
): Promise<{ block: string; chunkCount: number; indexMissing: boolean }> {
  let index = await loadVaultContentIndex(vaultRoot)
  if (!index) {
    const built = await buildVaultContentIndex(vaultRoot)
    if (!built.ok || !built.manifest) {
      return {
        block: formatVaultContextBlock({
          vaultRoot,
          chunks: [],
          indexedAt: 'not indexed',
          query,
        }),
        chunkCount: 0,
        indexMissing: true,
      }
    }
    index = await loadVaultContentIndex(vaultRoot)
  }

  if (!index) {
    return {
      block: formatVaultContextBlock({
        vaultRoot,
        chunks: [],
        indexedAt: 'not indexed',
        query,
      }),
      chunkCount: 0,
      indexMissing: true,
    }
  }

  const chunks = selectVaultChunksForQuery(index, query)
  return {
    block: formatVaultContextBlock({
      vaultRoot,
      chunks,
      indexedAt: index.manifest.indexedAt,
      query,
    }),
    chunkCount: chunks.length,
    indexMissing: false,
  }
}

/** Option 3 scaffold — vector DB not wired; keyword index is active. */
export const VAULT_VECTOR_INDEX_STATUS = {
  mode: 'keyword_file_index' as const,
  vectorDb: 'scaffold_only',
  note: 'Chroma/embedding retrieval can replace scoreVaultChunks later.',
}
