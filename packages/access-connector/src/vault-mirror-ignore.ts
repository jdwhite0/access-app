import { extname } from 'node:path'

export const MIRROR_EXCLUDE_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.turbo',
  'coverage',
  '.vercel',
  '.clerk',
  '.obsidian',
  '__pycache__',
  'logs',
  'cache',
  '.cache',
  '.pnpm-store',
  'tmp',
  'temp',
  '.Trash',
])

export const MIRROR_EXCLUDE_FILE_PATTERNS = [
  /^\.env/i,
  /\.pem$/i,
  /\.key$/i,
  /credentials/i,
  /secret/i,
  /api[_-]?key/i,
  /\.DS_Store$/,
  /package-lock\.json$/,
  /^\.access-connector-token\.json$/,
]

const BINARY_OR_MEDIA_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
  '.mp4',
  '.mov',
  '.mp3',
  '.wav',
  '.zip',
  '.tar',
  '.gz',
  '.pdf',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.bin',
  '.dmg',
  '.mindnode',
])

const TEXT_EXTENSIONS = new Set([
  '.md',
  '.json',
  '.yaml',
  '.yml',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.sql',
  '.sh',
  '.html',
  '.css',
  '.txt',
  '.csv',
])

export function shouldExcludeMirrorDir(name: string): boolean {
  return MIRROR_EXCLUDE_DIR_NAMES.has(name)
}

export function shouldExcludeMirrorFile(name: string): boolean {
  if (MIRROR_EXCLUDE_FILE_PATTERNS.some((re) => re.test(name))) return true
  const ext = extname(name).toLowerCase()
  if (BINARY_OR_MEDIA_EXTENSIONS.has(ext)) return true
  return false
}

export function isMirrorListableFile(name: string): boolean {
  if (shouldExcludeMirrorFile(name)) return false
  const ext = extname(name).toLowerCase()
  if (!ext) return name.endsWith('.md') || name === '_START_HERE.md'
  return TEXT_EXTENSIONS.has(ext)
}

export function isMirrorReadableDoc(name: string): boolean {
  const ext = extname(name).toLowerCase()
  return ext === '.md' || ext === '.txt' || name === '_START_HERE.md'
}
