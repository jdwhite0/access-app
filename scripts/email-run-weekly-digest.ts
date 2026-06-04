/**
 * Queue + optionally send weekly digest from recent dossiers.
 * Run: npm run email:weekly-digest:send
 */
import { loadAccessEnv } from '../lib/email/agents/load-env'
import { buildWeeklyDigestIntakeFromManifest } from '../lib/email/agents/weekly-digest-intake'
import { runEmailIntakePipeline, dispatchDueQueuedEmails } from '../lib/email/agents/pipeline'

async function main() {
  loadAccessEnv()

  const args = process.argv.slice(2)
  const sendNow = args.includes('--send')
  const intake = buildWeeklyDigestIntakeFromManifest()

  console.log('[email:weekly-digest] source_id:', intake.source_id)
  console.log('[email:weekly-digest] highlights:', (intake.payload.highlights as string[])?.length ?? 0)

  const result = await runEmailIntakePipeline(intake, { sendImmediately: sendNow })

  console.log(JSON.stringify({
    ok: result.ok,
    queued: result.queued,
    skipped: result.skipped,
    errors: result.errors,
    queue_ids: result.queue_ids,
    compliance: result.compliance?.compliant,
  }, null, 2))

  if (!result.ok) process.exit(1)

  if (sendNow || args.includes('--dispatch')) {
    const dispatch = await dispatchDueQueuedEmails(25)
    console.log('[email:weekly-digest] dispatch:', JSON.stringify(dispatch, null, 2))
    if (dispatch.failed > 0) process.exit(1)
  }
}

main().catch((err) => {
  console.error('[email:weekly-digest]', err instanceof Error ? err.message : err)
  process.exit(1)
})
