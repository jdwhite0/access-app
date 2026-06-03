#!/usr/bin/env npx tsx
/**
 * Phase 8 — OpenJarvis integration smoke checks (no live OpenJarvis server required).
 */
import { isRecentHeartbeat, CONNECTOR_ONLINE_TTL_MS } from '../lib/connector/connector-online'
import { checkToolPermission } from '../lib/openjarvis-bridge/permission-gate'
import { TOOL_REGISTRY } from '../lib/openjarvis-bridge/tool-registry'

let failed = false

function check(label: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`  ✓ ${label}`)
    if (detail) console.log(`      ${detail}`)
  } else {
    console.error(`  ✗ ${label}`)
    if (detail) console.error(`      ${detail}`)
    failed = true
  }
}

function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log(' Phase 8 — OpenJarvis Integration')
  console.log('═══════════════════════════════════════════════════\n')

  const recent = new Date(Date.now() - 30_000).toISOString()
  const stale = new Date(Date.now() - CONNECTOR_ONLINE_TTL_MS - 5_000).toISOString()
  check('Recent heartbeat online', isRecentHeartbeat(recent))
  check('Stale heartbeat offline', !isRecentHeartbeat(stale))

  const gate = checkToolPermission('read_file', {
    allowedActions: ['read_vault_seeds'],
    connectorOnline: true,
    cloudMode: false,
  })
  check('Tool allowed when connector online', gate.allowed, gate.reason)

  const cloudGate = checkToolPermission('read_file', {
    allowedActions: ['read_vault_seeds'],
    connectorOnline: false,
    cloudMode: true,
  })
  check('Tool blocked in cloud mode', !cloudGate.allowed, cloudGate.reason)

  const denyGate = checkToolPermission('write_file', {
    allowedActions: ['read_vault_seeds'],
    connectorOnline: true,
    cloudMode: false,
  })
  check('Write denied without action', !denyGate.allowed, denyGate.reason)

  check('Tool registry non-empty', TOOL_REGISTRY.length >= 8, `${TOOL_REGISTRY.length} tools`)

  console.log('\n═══════════════════════════════════════════════════')
  if (failed) {
    console.log(' PHASE 8 VERIFICATION: FAILED')
    process.exit(1)
  }
  console.log(' PHASE 8 VERIFICATION: PASS')
  console.log(' (Live OpenJarvis + connector heartbeat tested at runtime via API)')
  console.log('═══════════════════════════════════════════════════\n')
}

main()
