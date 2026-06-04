import { resolve, join } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'
import { publishDailyBriefSnapshot } from '@/lib/email/agents/intake-snapshot'
import type { EmailIntakePayload } from '@/lib/email/agents/types'

/**
 * Single publish funnel for every producer (local cron, cloud agent, serverless route).
 * Enforces the Quality Gate here so the Supabase snapshot can ONLY ever hold a brief
 * that passed — no matter who produced it. Pass { force: true } to override (manual only).
 */
export async function publishIntakeSnapshot(
  intake: EmailIntakePayload,
  options?: { force?: boolean }
): Promise<{ ok: boolean; error?: string }> {
  const requirePass = process.env.EMAIL_REQUIRE_QUALITY_PASS !== 'false'
  const passed = intake.payload?.quality_passed
  if (requirePass && !options?.force && passed !== true) {
    return {
      ok: false,
      error:
        passed === false
          ? `Refusing to publish: brief failed the quality gate (score ${intake.payload?.quality_score ?? '?'}, ${intake.payload?.quality_blocking ?? '?'} blocking).`
          : 'Refusing to publish: no quality verdict on this brief. Re-run the orchestrator to stamp one, or publish with force.',
    }
  }
  return publishDailyBriefSnapshot({
    intake,
    dossier_path: intake.source_path,
  })
}

export function loadAccessIntelligenceDossierJson(jsonPath: string): Record<string, unknown> {
  const abs = resolve(jsonPath)
  if (!existsSync(abs)) throw new Error(`Dossier not found: ${abs}`)
  const raw = JSON.parse(readFileSync(abs, 'utf8')) as Record<string, unknown>
  if (raw.artifact !== 'access_intelligence_dossier') {
    throw new Error(`Not an ACCESS Intelligence Dossier: ${abs}`)
  }
  return raw
}

export function defaultIntelligenceDossierDir(): string {
  const root = process.env.JDAI_CONTENT_ENGINE_PATH?.trim()
    ? resolve(process.env.JDAI_CONTENT_ENGINE_PATH.trim())
    : resolve(process.cwd(), '../jdai-content-engine')
  return join(root, 'intelligence', 'dossiers')
}
