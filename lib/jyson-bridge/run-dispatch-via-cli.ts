import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import type { CompanionDispatchDecision } from './build-agent-context-for-dispatch'

/** Fallback when Turbopack blocks monorepo imports in server actions. */
export function runJysonDispatchViaCli(
  handle: string,
  commandText: string
): { decision: CompanionDispatchDecision | null; error?: string } {
  const script = join(process.cwd(), 'scripts/dispatch-once.ts')
  try {
    const out = execFileSync(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['tsx', script, handle, commandText],
      { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 }
    )
    return JSON.parse(out.trim()) as {
      decision: CompanionDispatchDecision | null
      error?: string
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { decision: null, error: msg }
  }
}
