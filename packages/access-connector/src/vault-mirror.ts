import { mkdir, readdir, readFile, stat, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { AccessConnectorConfig } from './types.js'
import {
  isMirrorListableFile,
  isMirrorReadableDoc,
  shouldExcludeMirrorDir,
} from './vault-mirror-ignore.js'
import {
  resolveMonorepoRoot,
  resolveSystemMirrorDir,
  resolveVaultPath,
  SYSTEM_MIRROR_DIR,
} from './vault-mirror-paths.js'
import { runPostMirrorVaultResync } from './vault-mirror-resync.js'

const MAX_TREE_DEPTH = 4
const MAX_CHILDREN_LIST = 80
const README_EXCERPT_LINES = 24

export type MirrorFrontmatter = {
  generated_by: string
  source_path: string
  mirror_type: string
  last_mirrored: string
  account_scope: string
}

export type DirNode = {
  rel: string
  files: { name: string; sizeBytes: number }[]
  dirs: string[]
}

export type VaultMirrorReport = {
  mode: 'vault-mirror'
  ok: boolean
  error: string | null
  monorepoRoot: string
  mirrorDir: string
  mirroredAt: string
  notesWritten: number
  treeNodes: number
  resync: Awaited<ReturnType<typeof runPostMirrorVaultResync>> | null
}

function slugFromRel(rel: string): string {
  return rel.replace(/\//g, '__').replace(/\\/g, '__') || 'root'
}

function wikiLinkFromRel(rel: string): string {
  return `[[${slugFromRel(rel)}]]`
}

function buildFrontmatter(
  sourcePath: string,
  mirroredAt: string,
): string {
  const fm: MirrorFrontmatter = {
    generated_by: 'ACCESS local connector',
    source_path: sourcePath,
    mirror_type: 'founder_system',
    last_mirrored: mirroredAt,
    account_scope: 'founder',
  }
  return `---\n${Object.entries(fm)
    .map(([k, v]) => `${k}: "${String(v).replace(/"/g, '\\"')}"`)
    .join('\n')}\n---\n\n`
}

async function readExcerpt(absPath: string): Promise<string | null> {
  try {
    const raw = await readFile(absPath, 'utf8')
    const lines = raw.split('\n').slice(0, README_EXCERPT_LINES)
    return lines.join('\n').trim()
  } catch {
    return null
  }
}

const VAULT_TOP_PREFIX = 'JD Command Vault'

async function walkMonorepo(
  monorepoRoot: string,
  rel = '',
  depth = 0,
): Promise<DirNode[]> {
  if (depth > MAX_TREE_DEPTH) return []
  if (rel.startsWith(`${VAULT_TOP_PREFIX}/`) && rel.split('/').length > 2) {
    return []
  }

  const abs = rel ? join(monorepoRoot, rel) : monorepoRoot
  const nodes: DirNode[] = []

  let entries
  try {
    entries = await readdir(abs, { withFileTypes: true })
  } catch {
    return nodes
  }

  const files: DirNode['files'] = []
  const dirs: string[] = []

  for (const entry of entries) {
    if (entry.name === SYSTEM_MIRROR_DIR && (rel === VAULT_TOP_PREFIX || rel.startsWith(`${VAULT_TOP_PREFIX}/`))) {
      continue
    }
    if (entry.name === 'JD Command Vault' && !rel) {
      dirs.push(entry.name)
      continue
    }

    if (entry.isDirectory()) {
      if (shouldExcludeMirrorDir(entry.name)) continue
      dirs.push(entry.name)
      continue
    }

    if (!entry.isFile()) continue
    if (!isMirrorListableFile(entry.name)) continue

    try {
      const info = await stat(join(abs, entry.name))
      files.push({ name: entry.name, sizeBytes: info.size })
    } catch {
      /* skip */
    }
  }

  files.sort((a, b) => a.name.localeCompare(b.name))
  dirs.sort((a, b) => a.localeCompare(b))

  nodes.push({ rel: rel || '(root)', files, dirs })

  for (const dir of dirs.slice(0, MAX_CHILDREN_LIST)) {
    const childRel = rel ? `${rel}/${dir}` : dir
    const childNodes = await walkMonorepo(monorepoRoot, childRel, depth + 1)
    nodes.push(...childNodes)
  }

  return nodes
}

function formatDirNote(
  node: DirNode,
  monorepoRoot: string,
  mirroredAt: string,
  parentRel: string | null,
): string {
  const sourcePath = node.rel === '(root)' ? monorepoRoot : join(monorepoRoot, node.rel)
  const relDisplay = node.rel === '(root)' ? '.' : node.rel
  let body = buildFrontmatter(sourcePath.replace(/\\/g, '/'), mirroredAt)
  body += `# ${relDisplay}\n\n`
  if (parentRel !== null) {
    body += `Parent: ${wikiLinkFromRel(parentRel)}\n\n`
  }
  body += `## Directories (${node.dirs.length})\n\n`
  if (!node.dirs.length) body += '_None_\n\n'
  else {
    for (const d of node.dirs.slice(0, MAX_CHILDREN_LIST)) {
      const childRel = node.rel === '(root)' ? d : `${node.rel}/${d}`
      body += `- ${wikiLinkFromRel(childRel)} — \`${d}/\`\n`
    }
    body += '\n'
  }

  body += `## Files (${node.files.length})\n\n`
  if (!node.files.length) body += '_None_\n\n'
  else {
    for (const f of node.files.slice(0, MAX_CHILDREN_LIST)) {
      body += `- \`${f.name}\` (${f.sizeBytes} bytes)\n`
    }
    body += '\n'
  }

  return body
}

async function writeTreeNotes(
  mirrorDir: string,
  nodes: DirNode[],
  monorepoRoot: string,
  mirroredAt: string,
): Promise<number> {
  const treeDir = join(mirrorDir, 'tree')
  await mkdir(treeDir, { recursive: true })

  let written = 0
  for (const node of nodes) {
    const slug = slugFromRel(node.rel === '(root)' ? 'root' : node.rel)
    const parentRel =
      node.rel === '(root)' || !node.rel.includes('/')
        ? node.rel === '(root)'
          ? null
          : '(root)'
        : node.rel.replace(/\/[^/]+$/, '')

    let content = formatDirNote(node, monorepoRoot, mirroredAt, parentRel)

    if (node.rel !== '(root)') {
      const readme = node.files.find((f) => /^readme/i.test(f.name) && isMirrorReadableDoc(f.name))
      if (readme) {
        const excerpt = await readExcerpt(join(monorepoRoot, node.rel, readme.name))
        if (excerpt) {
          content += `## README excerpt (\`${readme.name}\`)\n\n${excerpt}\n\n`
        }
      }
    }

    const outPath = join(treeDir, `${slug}.md`)
    await writeFile(outPath, content, 'utf8')
    written += 1
  }

  return written
}

async function readTextIfExists(absPath: string, maxLines = 40): Promise<string> {
  if (!existsSync(absPath)) return '_Not found on disk._\n'
  try {
    const raw = await readFile(absPath, 'utf8')
    return raw.split('\n').slice(0, maxLines).join('\n').trim() + '\n'
  } catch {
    return '_Unreadable._\n'
  }
}

async function buildIndexNotes(
  mirrorDir: string,
  monorepoRoot: string,
  nodes: DirNode[],
  mirroredAt: string,
): Promise<void> {
  const rootNode = nodes.find((n) => n.rel === '(root)')
  const topDirs = rootNode?.dirs ?? []

  const accessDirs = nodes.filter((n) => n.rel.startsWith('access-app')).length
  const jysonPaths = [
    'access-app/lib',
    'access-app/app/api/jyson',
    'access-agent-runtime',
    'founder-runtime',
  ]
  const connectorPaths = nodes.filter((n) => n.rel.includes('access-connector'))

  const fm = (source: string) => buildFrontmatter(source, mirroredAt)

  const index00 = `${fm(mirrorDir)}# Founder System Index

Last mirrored: \`${mirroredAt}\`

## Navigation

- [[01 ACCESS App Map]]
- [[02 JYSON Runtime Map]]
- [[03 Connector Map]]
- [[04 Vault Sync Map]]
- [[05 Active Build State]]

## Monorepo

- Root: \`${monorepoRoot}\`
- Top-level areas: ${topDirs.map((d) => `\`${d}/\``).join(', ') || '_none_'}
- Tree notes: ${nodes.length} directory nodes under \`system_mirror/tree/\`

## Wiki

Use Obsidian graph links between tree nodes, e.g. ${wikiLinkFromRel('access-app')}.
`

  const index01 = `${fm(join(monorepoRoot, 'access-app'))}# ACCESS App Map

Parent: [[00 Founder System Index]]

## Key paths

- ${wikiLinkFromRel('access-app')} — application root
- ${wikiLinkFromRel('access-app__lib')} — shared libraries
- ${wikiLinkFromRel('access-app__lib__vault')} — vault sync + constants
- ${wikiLinkFromRel('access-app__app__api__connector')} — connector API routes
- ${wikiLinkFromRel('access-app__packages__access-connector')} — local connector package

## Stats

- Documented \`access-app/\` tree nodes: ${accessDirs}
`

  const index02 = `${fm(join(monorepoRoot, 'access-agent-runtime'))}# JYSON Runtime Map

Parent: [[00 Founder System Index]]

## Runtime modules

${jysonPaths.map((p) => `- ${wikiLinkFromRel(p)} — \`${p}\``).join('\n')}

## Agent / founder runtimes

- ${wikiLinkFromRel('access-agent-runtime')}
- ${wikiLinkFromRel('founder-runtime')}
- ${wikiLinkFromRel('founder-os')}
`

  const index03 = `${fm(join(monorepoRoot, 'access-app/packages/access-connector'))}# Connector Map

Parent: [[00 Founder System Index]]

## Package

- ${wikiLinkFromRel('access-app__packages__access-connector')}
- CLI: \`vault-mirror\`, \`vault-mirror-watch\`, \`scan\`, \`compile\`, \`sync-plan\`, \`sync-apply\`
- Connector tree nodes: ${connectorPaths.length}

## Commands (from access-app)

\`\`\`bash
npm run connector:vault:mirror
npm run connector:vault:watch
\`\`\`
`

  const index04 = `${fm(join(monorepoRoot, 'access-app/lib/vault'))}# Vault Sync Map

Parent: [[00 Founder System Index]]

## Platform vault layer

- ${wikiLinkFromRel('access-app__lib__vault')} — scan, constants, mirror helpers
- ${wikiLinkFromRel('access-app__lib__actions')} — \`requestVaultSync\` server actions
- Obsidian output: \`${SYSTEM_MIRROR_DIR}/\` (generated only)

## Sync flow

1. Connector mirrors monorepo → \`JD Command Vault/system_mirror/\`
2. Post-mirror scan + optional \`POST /api/connector/v1/vault/resync\`
3. UI \`requestVaultSync\` uses \`scanVaultLocalPath\` for live counts
`

  const taskPath = join(monorepoRoot, 'command_center', 'CURRENT_TASK.md')
  const statusPath = join(monorepoRoot, 'command_center', 'SYSTEM_STATUS.md')
  const todayPath = join(monorepoRoot, 'JD Command Vault', 'daily', 'today.md')

  const index05 = `${fm(taskPath)}# Active Build State

Parent: [[00 Founder System Index]]

## command_center/CURRENT_TASK.md

${await readTextIfExists(taskPath)}

## command_center/SYSTEM_STATUS.md

${await readTextIfExists(statusPath)}

## JD Command Vault/daily/today.md (excerpt)

${await readTextIfExists(todayPath)}
`

  const writes: [string, string][] = [
    ['00 Founder System Index.md', index00],
    ['01 ACCESS App Map.md', index01],
    ['02 JYSON Runtime Map.md', index02],
    ['03 Connector Map.md', index03],
    ['04 Vault Sync Map.md', index04],
    ['05 Active Build State.md', index05],
  ]

  for (const [name, content] of writes) {
    await writeFile(join(mirrorDir, name), content, 'utf8')
  }
}

async function pruneStaleTreeNotes(mirrorDir: string, nodes: DirNode[]): Promise<void> {
  const treeDir = join(mirrorDir, 'tree')
  if (!existsSync(treeDir)) return
  const valid = new Set(nodes.map((n) => `${slugFromRel(n.rel === '(root)' ? 'root' : n.rel)}.md`))
  valid.add('root.md')

  let entries: string[]
  try {
    entries = await readdir(treeDir)
  } catch {
    return
  }

  for (const name of entries) {
    if (!name.endsWith('.md')) continue
    if (!valid.has(name)) {
      await rm(join(treeDir, name), { force: true })
    }
  }
}

export async function runVaultMirror(
  config: AccessConnectorConfig,
  options?: {
    monorepoRoot?: string
    vaultPath?: string
    skipResync?: boolean
  },
): Promise<VaultMirrorReport> {
  const monorepoRoot = resolveMonorepoRoot(options?.monorepoRoot)
  const vaultPath = resolveVaultPath(options?.vaultPath)
  const mirrorDir = resolveSystemMirrorDir(vaultPath)
  const mirroredAt = new Date().toISOString()

  if (!existsSync(monorepoRoot)) {
    return {
      mode: 'vault-mirror',
      ok: false,
      error: `Monorepo root not found: ${monorepoRoot}`,
      monorepoRoot,
      mirrorDir,
      mirroredAt,
      notesWritten: 0,
      treeNodes: 0,
      resync: null,
    }
  }

  try {
    await mkdir(mirrorDir, { recursive: true })
    const nodes = await walkMonorepo(monorepoRoot)
    await pruneStaleTreeNotes(mirrorDir, nodes)
    const treeWritten = await writeTreeNotes(mirrorDir, nodes, monorepoRoot, mirroredAt)
    await buildIndexNotes(mirrorDir, monorepoRoot, nodes, mirroredAt)

    let resync: Awaited<ReturnType<typeof runPostMirrorVaultResync>> | null = null
    let resyncWarning: string | null = null
    if (!options?.skipResync) {
      try {
        resync = await runPostMirrorVaultResync(config, { vaultPath })
      } catch (err) {
        resyncWarning = err instanceof Error ? err.message : String(err)
      }
    }

    return {
      mode: 'vault-mirror',
      ok: true,
      error: resyncWarning,
      monorepoRoot,
      mirrorDir,
      mirroredAt,
      notesWritten: treeWritten + 6,
      treeNodes: nodes.length,
      resync,
    }
  } catch (err) {
    return {
      mode: 'vault-mirror',
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      monorepoRoot,
      mirrorDir,
      mirroredAt,
      notesWritten: 0,
      treeNodes: 0,
      resync: null,
    }
  }
}
