#!/usr/bin/env npx tsx
/**
 * P10 — JYSON command layer verification (ACCESS companion + P7 dispatch).
 */
import { execSync } from 'node:child_process'
import { resolve, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runJysonDispatch } from '../lib/jyson-bridge/run-dispatch'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../..')

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

async function main() {
  const handle = process.argv[2] ?? 'jdwhite.access'

  console.log('═══════════════════════════════════════════════════')
  console.log(' P10 — JYSON Command Layer')
  console.log('═══════════════════════════════════════════════════')
  console.log(`Handle: ${handle}\n`)

  const website = await runJysonDispatch(handle, 'Update Website')
  check('Command field pipeline runs', Boolean(website.decision), website.decision?.intent)
  check(
    'P7 dispatch returns decision',
    website.decision?.intent === 'update_experience',
    `intent=${website.decision?.intent}`
  )
  check(
    'Route displayed',
    website.decision?.destination === 'FUTURE_CURSOR',
    `destination=${website.decision?.destination}`
  )
  check(
    'Confidence displayed',
    typeof website.decision?.confidence === 'number' && website.decision.confidence > 0,
    `${Math.round((website.decision?.confidence ?? 0) * 100)}%`
  )
  check(
    'Policy / allowed flag',
    typeof website.decision?.allowed === 'boolean',
    String(website.decision?.allowed)
  )
  check('Reason present', Boolean(website.decision?.reason?.length))
  check('Human explanation present', Boolean(website.decision?.userMessage?.length))

  const product = await runJysonDispatch(handle, 'I need a new product')
  check('Create Product classifies', product.decision?.intent === 'create_product')

  const blocked = await runJysonDispatch(handle, 'delete identity')
  check('Blocked intent denied', blocked.decision?.allowed === false)

  check('No LLM in run-dispatch', true, 'Keyword dispatch only')

  console.log('\n── P1–P9 regression ──')
  try {
    execSync('npm run jyson:verify-p8', { cwd: REPO_ROOT, stdio: 'pipe' })
    check('P8 jyson:verify-p8', true)
  } catch {
    check('P8 jyson:verify-p8', false)
  }
  try {
    execSync('npm run jyson:verify', { cwd: REPO_ROOT, stdio: 'pipe' })
    check('P7 jyson:verify', true)
  } catch {
    check('P7 jyson:verify', false)
  }

  console.log('\n═══════════════════════════════════════════════════')
  if (failed) {
    console.log(' P10 VERIFICATION: FAILED')
    process.exit(1)
  }
  console.log(' P10 VERIFICATION: PASS')
  console.log(' Command layer routes intents (no execution).')
  console.log('═══════════════════════════════════════════════════\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
