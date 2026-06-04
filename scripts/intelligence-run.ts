/**
 * Research once → compile ACCESS Intelligence Dossier → run adapters → optional publish.
 */
import { loadAccessEnv } from '../lib/email/agents/load-env'
import { runIntelligencePipeline } from '../lib/operator/pipeline'

async function main() {
  loadAccessEnv()
  const args = process.argv.slice(2)
  const publish = args.includes('--publish')
  const weekly = args.includes('--weekly')
  const dossierArg = args.find((a) => a.startsWith('--dossier='))?.split('=')[1]

  const result = await runIntelligencePipeline({
    dossierPath: dossierArg,
    weekly,
    publish,
  })

  if (!result.ok) {
    console.error('[intelligence:run]', result.error)
    process.exit(1)
  }

  console.log(JSON.stringify(result, null, 2))
  if (publish) console.log('[intelligence:run] email snapshot published for ACCESS cron')
}

main().catch((err) => {
  console.error('[intelligence:run]', err instanceof Error ? err.message : err)
  process.exit(1)
})
