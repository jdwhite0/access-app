import { existsSync } from 'node:fs'
import { join, normalize, relative, resolve, sep } from 'node:path'

const ACCESS_APP = 'access-app'

function toPosix(p: string): string {
  return p.replace(/\\/g, '/')
}

export function collapseDuplicateAccessApp(input: string): string {
  let p = normalize(resolve(input.trim()))
  let posix = toPosix(p)
  const dup = `/${ACCESS_APP}/${ACCESS_APP}`
  while (posix.includes(dup)) {
    posix = posix.replaceAll(dup, `/${ACCESS_APP}`)
    p = normalize(posix)
  }
  return p
}

export function endsWithAccessApp(dir: string): boolean {
  const p = collapseDuplicateAccessApp(dir)
  const parts = p.split(sep)
  return parts[parts.length - 1] === ACCESS_APP
}

export function hasDuplicatedAccessAppSegment(dir: string): boolean {
  return toPosix(collapseDuplicateAccessApp(dir)).includes(`/${ACCESS_APP}/${ACCESS_APP}`)
}

/**
 * Canonical ACCESS app root for OpenJarvis file/list tools.
 * Never returns .../access-app/access-app.
 */
export function resolveAccessToolRoot(
  founderOsPath: string | null
): string | { error: string } {
  const cwd = collapseDuplicateAccessApp(process.cwd())
  let root = founderOsPath?.trim()
    ? collapseDuplicateAccessApp(resolve(founderOsPath.trim()))
    : cwd

  if (hasDuplicatedAccessAppSegment(root)) {
    root = collapseDuplicateAccessApp(root)
  }

  // Dev server runs inside access-app — prefer cwd when it is the app root
  if (endsWithAccessApp(cwd)) {
    if (hasDuplicatedAccessAppSegment(root) || !existsSync(root)) {
      root = cwd
    } else if (!endsWithAccessApp(root)) {
      root = cwd
    }
  }

  if (!endsWithAccessApp(root)) {
    const candidate = join(root, ACCESS_APP)
    if (endsWithAccessApp(join(root, ACCESS_APP, ACCESS_APP))) {
      return { error: `Invalid path: would duplicate ${ACCESS_APP} under ${root}` }
    }
    if (existsSync(candidate)) {
      root = collapseDuplicateAccessApp(candidate)
    }
  }

  if (hasDuplicatedAccessAppSegment(root)) {
    return {
      error: `Invalid working directory (duplicated ${ACCESS_APP} segment): ${root}`,
    }
  }

  if (!existsSync(root)) {
    return { error: `Working directory does not exist: ${root}` }
  }

  return root
}

/**
 * Resolve a relative (or absolute) path under the allowed tool root.
 */
export function resolveUnderToolRoot(
  root: string,
  relativePath: string
): { absolute: string } | { error: string } {
  const canonicalRoot = collapseDuplicateAccessApp(resolve(root))
  const raw = (relativePath ?? '.').trim() || '.'

  if (raw.includes('\0') || raw.includes('..')) {
    return { error: 'Path must be relative to the tool root without ..' }
  }

  let absolute: string
  if (raw.startsWith('/')) {
    absolute = collapseDuplicateAccessApp(resolve(raw))
  } else if (raw === '.') {
    absolute = canonicalRoot
  } else {
    absolute = collapseDuplicateAccessApp(
      join(canonicalRoot, raw.replace(/^\.\//, ''))
    )
  }

  if (hasDuplicatedAccessAppSegment(absolute)) {
    return {
      error: `Invalid path (duplicated ${ACCESS_APP} segment): ${absolute}`,
    }
  }

  const rel = relative(canonicalRoot, absolute)
  if (rel.startsWith('..') || (absolute !== canonicalRoot && rel.startsWith('..'))) {
    return { error: `Path escapes allowed root: ${relativePath}` }
  }

  if (!existsSync(absolute)) {
    return { error: `Path does not exist: ${absolute}` }
  }

  return { absolute }
}
