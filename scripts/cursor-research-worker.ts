/**
 * Isolated child process for Cursor Agent research.
 * Runs as a subprocess of the Slack bot — if the Cursor SDK calls process.exit()
 * or crashes natively, only this process dies; the bot stays alive.
 *
 * Input:  process.argv[2] = JSON string { prompt, apiKey, cwd }
 * Output: stdout = JSON string { ok, message }
 */
import { Agent } from '@cursor/sdk'

const raw = process.argv[2]
if (!raw) {
  process.stdout.write(JSON.stringify({ ok: false, message: 'cursor-research-worker: missing input argument' }))
  process.exit(1)
}

let input: { prompt: string; apiKey: string; cwd: string }
try {
  input = JSON.parse(raw) as { prompt: string; apiKey: string; cwd: string }
} catch {
  process.stdout.write(JSON.stringify({ ok: false, message: 'cursor-research-worker: invalid JSON input' }))
  process.exit(1)
}

try {
  const result = await Agent.prompt(input.prompt, {
    apiKey: input.apiKey,
    model: { id: 'composer-2.5' },
    local: { cwd: input.cwd },
  })
  const message = typeof result.result === 'string'
    ? result.result.slice(0, 2800)
    : JSON.stringify(result.result).slice(0, 2800)
  process.stdout.write(JSON.stringify({ ok: result.status === 'completed', message }))
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  process.stdout.write(JSON.stringify({ ok: false, message }))
}
