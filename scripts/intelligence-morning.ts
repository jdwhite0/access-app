/**
 * Canonical morning producer — the single daily entrypoint for the founder brief.
 *
 * Flow (gate-enforced end to end):
 *   1. Research the day's signal → write dossier markdown
 *   2. Compile → Quality Gate → publish the PASSED dossier to the Supabase snapshot
 *   3. The Vercel cron (6 AM ET) sends it; weak briefs are held by the gate
 *
 * Reused by:
 *   • Local fallback  → launchd job (automations/launchd) runs this at 5:30 AM ET
 *   • Cloud primary   → the scheduled Cursor agent runs the same research + `intelligence:run -- --publish`
 *
 * Research engine:
 *   • If CURSOR_API_KEY is set, spawns a Cursor agent to research + write + publish (full autonomy).
 *   • Otherwise, compiles + publishes the latest existing dossier on disk (still gated).
 *
 * Usage:  npm run intelligence:morning [-- --topic="..."]
 */
import { loadAccessEnv } from '../lib/email/agents/load-env'
import { runIntelligencePipeline, runCursorResearch } from '../lib/operator/pipeline'

function pickTopic(): string {
  const arg = process.argv.find((a) => a.startsWith('--topic='))?.split('=')[1]
  if (arg) return arg.replace(/^"|"$/g, '').trim()
  return (
    process.env.ACCESS_MORNING_TOPIC?.trim() ||
    "today's most important AI + business-infrastructure signal for ACCESS operators"
  )
}

async function main() {
  loadAccessEnv()
  const startedAt = new Date().toISOString()
  const topic = pickTopic()
  const hasCursorKey = Boolean(process.env.CURSOR_API_KEY?.trim())

  console.log(`[morning] ${startedAt} topic="${topic}" research=${hasCursorKey ? 'cursor-agent' : 'compile-latest'}`)

  if (hasCursorKey) {
    const research = await runCursorResearch(topic)
    console.log(JSON.stringify({ ok: research.ok, stage: 'research+publish', message: research.message.slice(0, 600) }, null, 2))
    if (!research.ok) process.exit(1)
    return
  }

  // No research engine available locally — compile + publish the latest dossier (gate-enforced).
  const result = await runIntelligencePipeline({ publish: true })
  console.log(JSON.stringify({ stage: 'compile-latest+publish', ...result }, null, 2))
  if (!result.ok) process.exit(1)
}

main().catch((err) => {
  console.error('[morning]', err instanceof Error ? err.message : err)
  process.exit(1)
})
