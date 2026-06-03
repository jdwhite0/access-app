#!/usr/bin/env npx tsx
/**
 * Path normalization checks for list_files / read_file mapping.
 */
import { mapAccessToolToOpenJarvis } from '../lib/openjarvis-bridge/openjarvis-tool-map'
import {
  collapseDuplicateAccessApp,
  resolveAccessToolRoot,
} from '../lib/openjarvis-bridge/path-resolve'
import { executeTool } from '../lib/openjarvis-bridge/adapter'

const ACCESS_ROOT = process.cwd()

function assertMap(
  label: string,
  toolId: 'read_file' | 'list_files',
  params: Record<string, unknown>,
  founderOsPath: string | null,
  expectSubpath?: string
) {
  const mapped = mapAccessToolToOpenJarvis(toolId, params, founderOsPath)
  if ('error' in mapped) {
    console.error(`FAIL ${label}:`, mapped.error)
    process.exit(1)
  }
  const path =
    toolId === 'read_file'
      ? String(mapped.params.path)
      : String(mapped.params.working_dir)
  if (path.includes('/access-app/access-app')) {
    console.error(`FAIL ${label}: duplicated access-app in ${path}`)
    process.exit(1)
  }
  if (expectSubpath && !path.includes(expectSubpath)) {
    console.error(`FAIL ${label}: expected path to include ${expectSubpath}, got ${path}`)
    process.exit(1)
  }
  console.log(`✓ ${label} → ${path}`)
}

async function main() {
  console.log('═══ list_files path normalization ═══\n')

  const bad = resolveAccessToolRoot(`${ACCESS_ROOT}/access-app`)
  if (typeof bad === 'string' && bad.includes('/access-app/access-app')) {
    console.error('FAIL collapse from doubled founder path')
    process.exit(1)
  }
  console.log(`✓ collapse duplicate → ${typeof bad === 'string' ? bad : bad.error}`)

  const collapsed = collapseDuplicateAccessApp(`${ACCESS_ROOT}/access-app`)
  if (collapsed !== ACCESS_ROOT) {
    console.error(`FAIL expected ${ACCESS_ROOT}, got ${collapsed}`)
    process.exit(1)
  }
  console.log(`✓ collapseDuplicateAccessApp`)

  assertMap('read_file package.json', 'read_file', { path: 'package.json' }, ACCESS_ROOT)
  assertMap('list_files .', 'list_files', { directory: '.' }, ACCESS_ROOT, ACCESS_ROOT)
  assertMap('list_files docs', 'list_files', { directory: 'docs' }, ACCESS_ROOT, '/docs')
  assertMap('list_files lib', 'list_files', { directory: 'lib' }, ACCESS_ROOT, '/lib')

  assertMap(
    'list_files . (doubled founder path)',
    'list_files',
    { directory: '.' },
    `${ACCESS_ROOT}/access-app`
  )

  const live = await executeTool('list_files', { directory: '.' }, {
    allowedActions: ['read_vault_seeds'],
    handle: 'path.verify',
    founderOsPath: `${ACCESS_ROOT}/access-app`,
    connectorOnline: true,
    userConfirmed: true,
  })

  if (!live.success || !live.runtimeCard?.success) {
    console.error('FAIL live list_files .:', live.error ?? live.runtimeCard?.error)
    process.exit(1)
  }
  console.log('✓ live list_files . (doubled founder path)')

  console.log('\nPATH NORMALIZATION: PASS')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
