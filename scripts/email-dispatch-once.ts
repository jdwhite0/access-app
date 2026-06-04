/**
 * Dispatch due emails from queue — no dev server required.
 * Run: npm run email:dispatch
 */
import { loadAccessEnv } from '../lib/email/agents/load-env'
import { dispatchDueQueuedEmails } from '../lib/email/agents/pipeline'

async function main() {
  loadAccessEnv()
  const limit = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? '25')
  const result = await dispatchDueQueuedEmails(Number.isFinite(limit) ? limit : 25)
  console.log(JSON.stringify(result, null, 2))
  if (result.failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error('[email:dispatch]', err instanceof Error ? err.message : err)
  process.exit(1)
})
