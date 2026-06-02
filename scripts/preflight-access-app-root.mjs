#!/usr/bin/env node
/**
 * Ensures npm scripts run from the ACCESS Next.js app root (access-app/).
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const MARKERS = [
  'package.json',
  'next.config.ts',
  'app',
  'supabase/APPLY_ORDER.md',
]

const missing = MARKERS.filter((m) => !existsSync(resolve(ROOT, m)))

let appOk = false
try {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))
  const dev = String(pkg?.scripts?.dev ?? '')
  const build = String(pkg?.scripts?.build ?? '')
  appOk =
    pkg?.name === 'app' &&
    (dev.includes('next dev') || build.includes('next build'))
} catch {
  /* checked via missing */
}

if (missing.length || !appOk) {
  console.error(
    [
      '',
      'ACCESS OS: wrong working directory.',
      '',
      `Current: ${ROOT}`,
      '',
      'Run commands from the canonical ACCESS app root:',
      '  cd /Users/jdproductions/Documents/JD_Ai_System/access-app',
      '',
      'Ecosystem / vault root (connector scan only):',
      '  export ACCESS_VAULT_ROOT="/Users/jdproductions/Documents/JD_Ai_System"',
      '',
      'Connector npm scripts (from access-app):',
      '  npm run connector:scan',
      '',
      missing.length
        ? `Missing here: ${missing.join(', ')}`
        : 'package.json is not the ACCESS app (expected name "app" and next dev/build scripts).',
      '',
    ].join('\n')
  )
  process.exit(1)
}
