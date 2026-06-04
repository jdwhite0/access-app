/**
 * Queue ACCESS Daily Brief from latest JDAI dossier — no dev server required.
 * Run from access-app/: npm run email:daily-brief
 * Send immediately: npm run email:daily-brief:send
 */
import { loadAccessEnv } from '../lib/email/agents/load-env'
import { buildDailyBriefIntakeFromLatest } from '../lib/email/agents/dossier-intake'
import { runEmailIntakePipeline, dispatchDueQueuedEmails } from '../lib/email/agents/pipeline'

async function main() {
  loadAccessEnv()

  const args = process.argv.slice(2)
  const sendNow = args.includes('--send')
  const dossierArg = args.find((a) => a.startsWith('--dossier='))?.split('=')[1]

  const { intake, dossierPath } = buildDailyBriefIntakeFromLatest({
    dossierPath: dossierArg,
  })

  console.log('[email:daily-brief] dossier:', dossierPath)
  console.log('[email:daily-brief] source_id:', intake.source_id)

  const result = await runEmailIntakePipeline(intake, { sendImmediately: sendNow })

  console.log(JSON.stringify({
    ok: result.ok,
    queued: result.queued,
    skipped: result.skipped,
    errors: result.errors,
    queue_ids: result.queue_ids,
    compliance: result.compliance?.compliant,
  }, null, 2))

  if (!result.ok) {
    process.exit(1)
  }

  if (sendNow || args.includes('--dispatch')) {
    const dispatch = await dispatchDueQueuedEmails(25)
    console.log('[email:daily-brief] dispatch:', JSON.stringify(dispatch, null, 2))
    if (dispatch.failed > 0) process.exit(1)
  }
}

main().catch((err) => {
  console.error('[email:daily-brief]', err instanceof Error ? err.message : err)
  process.exit(1)
})
