#!/usr/bin/env npx tsx
/**
 * Milestone 9 — native OpenJarvis tool invoke (requires live stack).
 * PRIVATE_JYSON_ENABLED=true, OpenJarvis :8000, connector optional for this script.
 */
import { checkToolPermission } from '../lib/openjarvis-bridge/permission-gate'
import { mapAccessToolToOpenJarvis } from '../lib/openjarvis-bridge/openjarvis-tool-map'
import { assertToolInCatalog, fetchOpenJarvisToolCatalog } from '../lib/openjarvis-bridge/native-tool-invoke'
import { executeTool } from '../lib/openjarvis-bridge/adapter'

const ACCESS_ROOT = process.cwd()
const TARGET = `${ACCESS_ROOT}/package.json`

async function main() {
  console.log('═══ Milestone 9 — Native tool invoke ═══\n')

  const catalog = await fetchOpenJarvisToolCatalog()
  if (catalog.error) {
    console.error('FAIL catalog:', catalog.error)
    process.exit(1)
  }
  console.log(`✓ GET /v1/tools — ${catalog.tools.length} tools`)
  console.log(`  file_read in catalog: ${catalog.tools.some((t) => t.name === 'file_read')}`)

  const gate = checkToolPermission('read_file', {
    allowedActions: ['read_vault_seeds'],
    connectorOnline: true,
    cloudMode: false,
  })
  console.log(`✓ ACCESS gate: ${gate.allowed} — ${gate.reason}`)

  const mapped = mapAccessToolToOpenJarvis('read_file', { path: 'package.json' }, ACCESS_ROOT)
  if ('error' in mapped) {
    console.error('FAIL map:', mapped.error)
    process.exit(1)
  }
  console.log(`✓ Map read_file → ${mapped.openJarvisToolId}`, mapped.params)

  const catErr = await assertToolInCatalog(mapped.openJarvisToolId)
  if (catErr) {
    console.error('FAIL catalog assert:', catErr)
    process.exit(1)
  }

  const result = await executeTool('read_file', { path: 'package.json' }, {
    allowedActions: ['read_vault_seeds'],
    handle: 'm9.verify',
    founderOsPath: ACCESS_ROOT,
    connectorOnline: true,
    userConfirmed: true,
  })

  console.log('\n--- Request (logical) ---')
  console.log('POST /api/jyson/openjarvis/execute')
  console.log(JSON.stringify({ toolId: 'read_file', params: { path: 'package.json' } }, null, 2))

  console.log('\n--- Response ---')
  console.log(JSON.stringify(result, null, 2))

  if (!result.success || !result.runtimeCard?.success) {
    console.error('\nM9 NATIVE TOOL: FAIL')
    process.exit(1)
  }
  if (!String(result.runtimeCard.content ?? '').includes('"name"')) {
    console.error('\nM9 NATIVE TOOL: FAIL — expected package.json content')
    process.exit(1)
  }
  console.log('\nM9 NATIVE TOOL: PASS')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
