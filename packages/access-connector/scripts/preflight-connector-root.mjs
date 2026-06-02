#!/usr/bin/env node
/**
 * Ensures connector CLI runs from packages/access-connector (or via access-app npm scripts).
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = process.cwd()
const pkgPath = resolve(ROOT, 'package.json')
const srcCli = resolve(ROOT, 'src/cli.ts')

if (!existsSync(pkgPath) || !existsSync(srcCli)) {
  console.error(
    [
      '',
      'ACCESS Connector: wrong working directory.',
      '',
      `Current: ${ROOT}`,
      '',
      'Option A — from access-app:',
      '  cd /Users/jdproductions/Documents/JD_Ai_System/access-app',
      '  npm run connector:scan',
      '',
      'Option B — direct:',
      '  cd /Users/jdproductions/Documents/JD_Ai_System/access-app/packages/access-connector',
      '  npm run scan',
      '',
    ].join('\n')
  )
  process.exit(1)
}

try {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  if (pkg.name !== '@jd/access-connector') {
    throw new Error('not connector package')
  }
} catch {
  console.error('ACCESS Connector: package.json is not @jd/access-connector.')
  process.exit(1)
}
