#!/usr/bin/env node
import { loadConnectorConfig } from './config.js'
import { runCompile } from './compile.js'
import { runHeartbeat } from './heartbeat.js'
import { runRegister } from './register.js'
import { runScan } from './scan.js'
import { runSyncApply } from './sync-apply.js'
import { runSyncPlan } from './sync-plan.js'
import { runVaultMirror } from './vault-mirror.js'
import { runVaultMirrorWatch } from './vault-mirror-watch.js'

async function main() {
  const command = process.argv[2] ?? 'help'
  const arg = process.argv[3]

  if (command === 'help' || command === '--help' || command === '-h') {
    console.log(`ACCESS Local Connector — Phase 4

Commands:
  register <CODE>   Pair device (no Supabase service role)
  heartbeat         Device heartbeat
  scan              Metadata scan → vault-scan-report.json
  compile           Compile summary → vault-compile-summary.json
  sync-plan         Plan → registry-sync-plan.json
  sync-apply        Apply plan via device JWT
  vault-mirror      Mirror monorepo → vault system_mirror/
  vault-mirror-watch  Debounced watch → re-mirror on change

Environment:
  ACCESS_API_BASE_URL          Default http://localhost:3000
  ACCESS_VAULT_ROOT            Obsidian vault path (scan + mirror target)
  ACCESS_MONOREPO_ROOT         Monorepo root to mirror (optional)
  ACCESS_CONNECTOR_MACHINE_ID  Optional device id

Config: config.local.json (see config.example.json)
`)
    process.exit(0)
  }

  const config = loadConnectorConfig()

  if (command === 'register') {
    if (!arg) {
      console.error('Usage: npm run register -- <PAIRING_CODE>')
      process.exit(1)
    }
    const result = await runRegister(config, { pairingCode: arg })
    console.log(JSON.stringify(result, null, 2))
    process.exit(result.ok ? 0 : 1)
  }

  if (command === 'heartbeat') {
    const result = await runHeartbeat()
    console.log(JSON.stringify(result, null, 2))
    process.exit(result.ok ? 0 : 1)
  }

  if (command === 'scan') {
    const report = await runScan(config)
    console.log(JSON.stringify(report, null, 2))
    process.exit(report.ok ? 0 : 1)
  }

  if (command === 'compile') {
    const report = await runCompile(config)
    console.log(JSON.stringify(report, null, 2))
    process.exit(report.ok ? 0 : 1)
  }

  if (command === 'sync-plan') {
    const plan = await runSyncPlan(config)
    if ('ok' in plan && plan.ok === false) {
      console.error(plan.error)
      process.exit(1)
    }
    console.log(JSON.stringify(plan, null, 2))
    process.exit(0)
  }

  if (command === 'sync-apply') {
    const result = await runSyncApply(config)
    console.log(JSON.stringify(result, null, 2))
    process.exit(result.ok ? 0 : 1)
  }

  if (command === 'vault-mirror') {
    const result = await runVaultMirror(config)
    console.log(JSON.stringify(result, null, 2))
    process.exit(result.ok ? 0 : 1)
  }

  if (command === 'vault-mirror-watch') {
    const result = await runVaultMirrorWatch(config)
    console.log(JSON.stringify(result, null, 2))
    process.exit(result.ok ? 0 : 1)
  }

  console.error(`Unknown command: ${command}`)
  process.exit(1)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
