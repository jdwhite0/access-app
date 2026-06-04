/**
 * Publish latest JDAI dossier intake to Supabase for Vercel cron.
 * Run: npm run email:publish-dossier
 */
import { loadAccessEnv } from '../lib/email/agents/load-env'
import { resolveDailyBriefIntake } from '../lib/email/agents/dossier-intake'

async function main() {
  loadAccessEnv()

  const { intake, dossierPath, source } = await resolveDailyBriefIntake({
    publishSnapshot: true,
  })

  console.log(JSON.stringify({
    ok: true,
    source,
    dossierPath,
    source_id: intake.source_id,
    message: 'Daily brief snapshot published for production cron.',
  }, null, 2))
}

main().catch((err) => {
  console.error('[email:publish-dossier]', err instanceof Error ? err.message : err)
  process.exit(1)
})
