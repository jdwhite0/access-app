import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'
import type { EmailIntakePayload } from '@/lib/email/agents/types'

export type AccessIntelligenceHeadline = {
  title: string
  explainer?: string
  source_url?: string
  source_label?: string
}

/** Load ACCESS Intelligence Dossier JSON from disk and map to email intake (server-side). */
export function intakeFromIntelligenceDossierJson(jsonPath: string): EmailIntakePayload {
  const abs = resolve(jsonPath)
  const raw = JSON.parse(readFileSync(abs, 'utf8')) as Record<string, unknown>
  return mapDossierJsonToIntake(raw, { sourcePathFallback: abs })
}

/**
 * Map an in-memory ACCESS Intelligence Dossier object to an email intake payload.
 * Shared by the disk loader and the serverless publish boundary so both produce
 * identical intake — including the quality verdict the send path enforces.
 */
export function mapDossierJsonToIntake(
  raw: Record<string, unknown>,
  opts?: { sourcePathFallback?: string }
): EmailIntakePayload {
  const abs = opts?.sourcePathFallback ?? 'memory:dossier'
  if (raw.artifact !== 'access_intelligence_dossier') {
    throw new Error(`Not an ACCESS Intelligence Dossier: ${abs}`)
  }

  const source_id = String(raw.source_id ?? '')
  const signal = (raw.signal ?? {}) as Record<string, unknown>
  const intelligence = (raw.intelligence ?? {}) as Record<string, unknown>
  const distribution = (raw.distribution ?? {}) as Record<string, unknown>
  const angles = (distribution.angles ?? {}) as Record<string, unknown>
  const emailAngle = (angles.email ?? {}) as Record<string, unknown>
  const provenance = (raw.provenance ?? {}) as Record<string, unknown>
  const creative = (raw.creative ?? {}) as Record<string, unknown>

  const hook = typeof emailAngle.hook === 'string' ? emailAngle.hook.replace(/^"|"$/g, '') : undefined
  const subjectFromHook = hook ? hook.slice(0, 72) : String(intelligence.summary ?? '').slice(0, 72)
  const subject_line = `ACCESS Daily Brief — ${subjectFromHook}`

  const sourcesUsed = Array.isArray(provenance.sources_used)
    ? (provenance.sources_used as { label?: string; url?: string; verified?: boolean }[])
    : []
  const verifiedSources = sourcesUsed.filter((s) => s.verified)
  const quality = (raw.quality ?? null) as
    | { passed?: boolean; overall?: number; grade?: string; min_score?: number; blocking?: number }
    | null

  return {
    source_type: 'access_intelligence_dossier',
    source_id,
    source_path: typeof provenance.content_dossier_path === 'string' ? provenance.content_dossier_path : abs,
    payload: {
      email_type: 'daily_brief',
      template: 'the_mode',
      access_intelligence_dossier_id: source_id,
      subject_line,
      preheader: typeof intelligence.recommended_action === 'string'
        ? intelligence.recommended_action.slice(0, 120)
        : undefined,
      handle: process.env.ACCESS_DAILY_BRIEF_HANDLE ?? 'operator',
      system_status: typeof signal.system_status === 'string'
        ? signal.system_status
        : typeof signal.summary === 'string'
          ? signal.summary.slice(0, 200)
          : 'ACCESS intelligence cycle complete.',
      market_signal: {
        category: typeof signal.category === 'string' ? signal.category : 'Intelligence',
        summary: typeof signal.summary === 'string' ? signal.summary : '',
      },
      signal_score: typeof signal.signal_score === 'number' ? signal.signal_score : undefined,
      confidence_score:
        typeof distribution.confidence_score === 'number' ? distribution.confidence_score : undefined,
      timing_rationale: typeof signal.timing_rationale === 'string' ? signal.timing_rationale : undefined,
      verified_sources_count: verifiedSources.length,
      sources_count: sourcesUsed.length,
      sources: sourcesUsed,
      hook,
      quality_passed: quality ? quality.passed === true : undefined,
      quality_score: quality && typeof quality.overall === 'number' ? quality.overall : undefined,
      quality_grade: quality && typeof quality.grade === 'string' ? quality.grade : undefined,
      quality_blocking: quality && typeof quality.blocking === 'number' ? quality.blocking : undefined,
      intelligence_summary: String(intelligence.summary ?? ''),
      intelligence: String(intelligence.summary ?? ''),
      topic: String(raw.topic ?? ''),
      positioning_read: typeof intelligence.positioning_read === 'string' ? intelligence.positioning_read : undefined,
      pain_points: Array.isArray(intelligence.pain_points) ? (intelligence.pain_points as string[]) : [],
      headlines: intelligence.headlines ?? [],
      key_takeaways: intelligence.key_takeaways ?? [],
      recommended_action: String(intelligence.recommended_action ?? ''),
      product_tip: String(intelligence.product_context ?? ''),
      product_context: String(intelligence.product_context ?? ''),
      visual_ideas: creative.visual_ideas ?? [],
      charts: Array.isArray(creative.charts) ? creative.charts : [],
      feedback_enabled: true,
      cta: {
        label: typeof emailAngle.cta === 'string' ? emailAngle.cta : 'Open ACCESS',
        href: '/dashboard',
      },
    },
  }
}

export function resolveLatestIntelligenceDossierJson(dir: string): string | null {
  if (!existsSync(dir)) return null
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !f.startsWith('weekly-synthesis'))
    .map((f) => join(dir, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  return files[0] ?? null
}

export function defaultIntelligenceDossierDir(): string {
  const root = process.env.JDAI_CONTENT_ENGINE_PATH?.trim()
    ? resolve(process.env.JDAI_CONTENT_ENGINE_PATH.trim())
    : resolve(process.cwd(), '../jdai-content-engine')
  return join(root, 'intelligence', 'dossiers')
}
