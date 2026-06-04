/**
 * Publish latest ACCESS Intelligence Dossier (email adapter output) to Supabase snapshot.
 * Run: npm run intelligence:publish
 */
import { loadAccessEnv } from '../lib/email/agents/load-env'
import {
  intakeFromIntelligenceDossierJson,
  resolveLatestIntelligenceDossierJson,
  defaultIntelligenceDossierDir,
} from '../lib/intelligence/load-dossier'
import { publishIntakeSnapshot } from '../lib/intelligence/publish-from-intake'

async function main() {
  loadAccessEnv()

  const jsonDir = defaultIntelligenceDossierDir()
  const jsonPath = resolveLatestIntelligenceDossierJson(jsonDir)
  if (!jsonPath) {
    throw new Error(`No intelligence dossier JSON in ${jsonDir}. Run npm run intelligence:run first.`)
  }

  const force = process.argv.slice(2).includes('--force')
  const intake = intakeFromIntelligenceDossierJson(jsonPath)
  const result = await publishIntakeSnapshot(intake, { force })
  if (!result.ok) {
    throw new Error(`Publish failed: ${result.error ?? 'unknown'}`)
  }

  console.log(JSON.stringify({
    ok: true,
    jsonPath,
    source_id: intake.source_id,
    source_type: intake.source_type,
    template: intake.payload.template,
    message: 'ACCESS Intelligence Dossier published for production cron.',
  }, null, 2))
}

main().catch((err) => {
  console.error('[intelligence:publish]', err instanceof Error ? err.message : err)
  process.exit(1)
})
