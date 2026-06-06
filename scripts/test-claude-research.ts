import { loadAccessEnv } from '../lib/email/agents/load-env'
import { runClaudeResearch } from '../lib/operator/pipeline'
loadAccessEnv()

async function main() {
  const topic = process.argv[2] ?? 'PATH ETF and top ETFs for investment June 5 2026'
  console.log(`[test] researching: "${topic}"`)

  const result = await runClaudeResearch(topic)
  console.log('[test] ok:', result.ok)
  console.log('[test] message:', result.message)
  if (result.jsonPath) {
    console.log('[test] jsonPath:', result.jsonPath)
  }
  if (!result.ok) process.exit(1)
}

main().catch((err) => { console.error(err); process.exit(1) })
