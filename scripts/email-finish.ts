/**
 * One-command email system finish: publish dossier snapshot + verify agents.
 * Optional: --send dispatches a fresh founder daily brief.
 * Run: npm run email:finish
 */
import { loadAccessEnv } from '../lib/email/agents/load-env'
import { resolveDailyBriefIntake } from '../lib/email/agents/dossier-intake'
import { runEmailIntakePipeline, dispatchDueQueuedEmails } from '../lib/email/agents/pipeline'
import { execSync } from 'node:child_process'

async function main() {
  loadAccessEnv()
  const send = process.argv.includes('--send')

  console.log('[email:finish] Step 1/2 — publish dossier snapshot for production cron')
  const { intake, dossierPath, source } = await resolveDailyBriefIntake({ publishSnapshot: true })
  console.log(JSON.stringify({ dossierPath, source, source_id: intake.source_id }, null, 2))

  if (send) {
    intake.source_id = `finish-${Date.now()}`
    console.log('[email:finish] Sending founder daily brief...')
    const result = await runEmailIntakePipeline(intake, { sendImmediately: true })
    console.log(JSON.stringify({ queued: result.queued, sent_pipeline: result.ok }, null, 2))
    const dispatch = await dispatchDueQueuedEmails(25)
    console.log(JSON.stringify(dispatch, null, 2))
    if (dispatch.failed > 0) process.exit(1)
  }

  console.log('[email:finish] Step 2/2 — verify agents')
  execSync('npx tsx scripts/email-verify-agents.ts', { stdio: 'inherit', cwd: process.cwd() })
}

main().catch((err) => {
  console.error('[email:finish]', err instanceof Error ? err.message : err)
  process.exit(1)
})
