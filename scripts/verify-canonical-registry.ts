/**
 * M6.0 — Verify repo against JD_AI_SYSTEMS_CANONICAL_REGISTRY.md
 * - Forbidden path literals (e.g. "access app/") and unregistered product: literals
 * - product: '...' literals must use allowed product_ids
 * - PlatformProductId union in status-types.ts matches allowlist (read-only)
 *
 * npx tsx scripts/verify-canonical-registry.ts
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

type Rules = {
  registryRelativePath: string
  allowedProductIds: string[]
  forbiddenLiterals: {
    id: string
    pattern: string
    flags: string
    message: string
  }[]
  allowlistPathSubstrings: string[]
  scanDirs: string[]
  scanExtensions: string[]
  skipDirNames: string[]
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const ACCESS_APP_ROOT = resolve(__dirname, '..')
const allowlist = JSON.parse(
  readFileSync(join(__dirname, 'canonical-registry-allowlist.json'), 'utf8')
) as Rules
const MONOREPO_ROOT = resolve(ACCESS_APP_ROOT, '..')

function loadRegistryProductIds(registryPath: string): string[] {
  const text = readFileSync(registryPath, 'utf8')
  const section = text.split('## Products')[1]?.split('### Forbidden')[0] ?? ''
  const ids: string[] = []
  for (const line of section.split('\n')) {
    const m = line.match(/^\|\s*`([a-z][a-z0-9_]*)`\s*\|/)
    if (m) ids.push(m[1])
  }
  return ids
}

function isAllowlisted(relPath: string, rules: Rules): boolean {
  return rules.allowlistPathSubstrings.some((s) => relPath.includes(s))
}

function walkFiles(
  root: string,
  rules: Rules,
  files: { abs: string; rel: string }[]
): void {
  if (!existsSync(root)) return
  const entries = readdirSync(root, { withFileTypes: true })
  for (const ent of entries) {
    const abs = join(root, ent.name)
    const rel = relative(MONOREPO_ROOT, abs)
    if (ent.isDirectory()) {
      if (rules.skipDirNames.includes(ent.name)) continue
      walkFiles(abs, rules, files)
      continue
    }
    if (!ent.isFile()) continue
    const ext = ent.name.includes('.')
      ? ent.name.slice(ent.name.lastIndexOf('.'))
      : ''
    if (!rules.scanExtensions.includes(ext)) continue
    if (isAllowlisted(rel, rules)) continue
    files.push({ abs, rel })
  }
}

function checkForbiddenLiterals(
  rel: string,
  content: string,
  rules: Rules
): string[] {
  const issues: string[] = []
  for (const rule of rules.forbiddenLiterals) {
    const re = new RegExp(rule.pattern, rule.flags)
    if (re.test(content)) {
      issues.push(`[${rule.id}] ${rule.message} (file: ${rel})`)
    }
  }
  return issues
}

const PRODUCT_LITERAL = /product:\s*['"]([a-z][a-z0-9_]*)['"]/g

function checkProductLiterals(
  rel: string,
  content: string,
  allowed: Set<string>
): string[] {
  const issues: string[] = []
  for (const m of content.matchAll(PRODUCT_LITERAL)) {
    const id = m[1]
    if (!allowed.has(id)) {
      issues.push(
        `[unregistered_product] product: '${id}' is not in canonical registry (file: ${rel})`
      )
    }
  }
  return issues
}

function checkStatusTypesUnion(allowed: Set<string>): string[] {
  const path = join(
    ACCESS_APP_ROOT,
    'lib/platform-health/status-types.ts'
  )
  if (!existsSync(path)) {
    return ['[missing] lib/platform-health/status-types.ts not found']
  }
  const text = readFileSync(path, 'utf8')
  const block = text.match(
    /export type PlatformProductId\s*=\s*([\s\S]*?)(?:\n\n|export type)/
  )?.[1]
  if (!block) {
    return ['[parse] Could not parse PlatformProductId in status-types.ts']
  }
  const found = [...block.matchAll(/'([a-z][a-z0-9_]*)'/g)].map((m) => m[1])
  const issues: string[] = []
  for (const id of found) {
    if (!allowed.has(id)) {
      issues.push(
        `[status-types] PlatformProductId includes '${id}' — not in canonical registry`
      )
    }
  }
  for (const id of allowed) {
    if (!found.includes(id)) {
      issues.push(
        `[status-types] Canonical product '${id}' missing from PlatformProductId union`
      )
    }
  }
  return issues
}

function main(): void {
  const rules = allowlist as Rules
  const registryPath = resolve(
    ACCESS_APP_ROOT,
    rules.registryRelativePath
  )

  if (!existsSync(registryPath)) {
    console.error(`Registry not found: ${registryPath}`)
    process.exit(1)
  }

  const fromRegistry = loadRegistryProductIds(registryPath)
  const allowed = new Set(rules.allowedProductIds)

  const registryMismatch: string[] = []
  for (const id of fromRegistry) {
    if (!allowed.has(id)) {
      registryMismatch.push(
        `Registry lists '${id}' but allowlist JSON does not — sync canonical-registry-allowlist.json`
      )
    }
  }
  for (const id of allowed) {
    if (!fromRegistry.includes(id)) {
      registryMismatch.push(
        `Allowlist JSON has '${id}' but registry MD Products table does not`
      )
    }
  }

  const files: { abs: string; rel: string }[] = []
  for (const dir of rules.scanDirs) {
    const root = resolve(ACCESS_APP_ROOT, dir)
    if (!existsSync(root)) {
      console.warn(`skip (missing): ${relative(MONOREPO_ROOT, root)}`)
      continue
    }
    walkFiles(root, rules, files)
  }

  const issues: string[] = [...registryMismatch]

  for (const { abs, rel } of files) {
    let content: string
    try {
      content = readFileSync(abs, 'utf8')
    } catch {
      continue
    }
    issues.push(...checkForbiddenLiterals(rel, content, rules))
    issues.push(...checkProductLiterals(rel, content, allowed))
  }

  issues.push(...checkStatusTypesUnion(allowed))

  console.log('JD AI Systems — canonical registry verify (M6.0)')
  console.log(`Registry: ${relative(MONOREPO_ROOT, registryPath)}`)
  console.log(`Allowed products: ${[...allowed].join(', ')}`)
  console.log(`Scanned files: ${files.length}`)

  if (issues.length === 0) {
    console.log('OK — no registry drift detected')
    process.exit(0)
  }

  console.error(`FAIL — ${issues.length} issue(s):`)
  for (const i of issues) console.error(`  - ${i}`)
  process.exit(1)
}

main()
