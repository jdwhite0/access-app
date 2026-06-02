/**
 * Verify status page projections from Command Center bundle.
 * npx tsx scripts/verify-status-page.ts
 */
import { buildCommandCenterBundle } from '../lib/command-center/build-bundle'
import {
  projectStatusPage,
  assertConsumerPayloadSafe,
  projectConsumerStatus,
} from '../lib/status-page/project-audience-view'

function main() {
  const bundle = buildCommandCenterBundle()
  const issues: string[] = []

  const consumer = projectConsumerStatus(bundle)
  issues.push(...assertConsumerPayloadSafe(consumer))

  const consumerVia = projectStatusPage('consumer', bundle)
  if (consumerVia.audience !== 'consumer') {
    issues.push('projectStatusPage consumer audience mismatch')
  }
  if ('recommendations' in consumerVia) {
    issues.push('consumer projection leaked recommendations')
  }

  const operator = projectStatusPage('operator', bundle)
  if (operator.audience !== 'operator') issues.push('operator audience mismatch')
  if (!('topAction' in operator)) issues.push('operator missing topAction')

  const developer = projectStatusPage('developer', bundle)
  if (developer.audience !== 'developer') issues.push('developer audience mismatch')
  if (!('recommendations' in developer)) issues.push('developer missing recommendations')

  if (bundle.generatedAt !== consumer.updatedAt) {
    issues.push('generatedAt !== consumer updatedAt')
  }

  console.log('JD AI Systems — status page verify')
  console.log(`Bundle incidents: ${bundle.incidents.length}`)
  console.log(`Consumer products: ${consumer.products.length}`)

  if (issues.length) {
    console.error(`FAIL — ${issues.length} issue(s):`)
    for (const i of issues) console.error(`  - ${i}`)
    process.exit(1)
  }
  console.log('OK — status projections valid')
}

main()
