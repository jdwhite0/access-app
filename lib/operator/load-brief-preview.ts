import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defaultIntelligenceDossierDir, resolveLatestIntelligenceDossierJson } from '@/lib/intelligence/load-dossier'
import { resolveTopicDossier, runIntelligencePipeline } from '@/lib/operator/pipeline'

export type DossierPreview = {
  source_id: string
  topic: string
  jsonPath: string
  signal_score?: number
  signal_summary: string
  intelligence_summary: string
  headlines: { title: string; explainer?: string }[]
  key_takeaways: string[]
  recommended_action: string
  product_context?: string
  positioning_read?: string
  hook?: string
}

function parseDossierJson(jsonPath: string): DossierPreview {
  const raw = JSON.parse(readFileSync(jsonPath, 'utf8')) as Record<string, unknown>
  const signal = (raw.signal ?? {}) as Record<string, unknown>
  const intelligence = (raw.intelligence ?? {}) as Record<string, unknown>
  const distribution = (raw.distribution ?? {}) as Record<string, unknown>
  const angles = (distribution.angles ?? {}) as Record<string, unknown>
  const emailAngle = (angles.email ?? {}) as Record<string, unknown>

  return {
    source_id: String(raw.source_id ?? ''),
    topic: String(raw.topic ?? ''),
    jsonPath,
    signal_score: typeof signal.signal_score === 'number' ? signal.signal_score : undefined,
    signal_summary: String(signal.summary ?? ''),
    intelligence_summary: String(intelligence.summary ?? ''),
    headlines: Array.isArray(intelligence.headlines)
      ? (intelligence.headlines as { title: string; explainer?: string }[])
      : [],
    key_takeaways: Array.isArray(intelligence.key_takeaways)
      ? (intelligence.key_takeaways as string[])
      : [],
    recommended_action: String(intelligence.recommended_action ?? ''),
    product_context: typeof intelligence.product_context === 'string' ? intelligence.product_context : undefined,
    positioning_read: typeof intelligence.positioning_read === 'string' ? intelligence.positioning_read : undefined,
    hook: typeof emailAngle.hook === 'string' ? emailAngle.hook : undefined,
  }
}

/** Compile (if needed) and load dossier for Slack review. */
export async function loadBriefForReview(options: {
  topic?: string
  dossierPath?: string
}): Promise<{ ok: true; preview: DossierPreview } | { ok: false; error: string }> {
  let dossierPath = options.dossierPath
  if (options.topic && !dossierPath) {
    dossierPath = resolveTopicDossier(options.topic) ?? undefined
  }
  if (!dossierPath) {
    return {
      ok: false,
      error: options.topic
        ? `No dossier for "${options.topic}". Say \`research ${options.topic}\` to create one first.`
        : 'No topic specified. Try `brief on platform infrastructure` or `list topics`.',
    }
  }

  if (dossierPath.endsWith('.md') || !dossierPath.endsWith('.json')) {
    const compiled = await runIntelligencePipeline({ dossierPath, publish: false })
    if (!compiled.ok || !compiled.jsonPath) {
      return { ok: false, error: compiled.error ?? 'Compile failed' }
    }
    dossierPath = compiled.jsonPath
  }

  const abs = resolve(dossierPath)
  if (!existsSync(abs)) {
    return { ok: false, error: `Dossier not found: ${abs}` }
  }

  return { ok: true, preview: parseDossierJson(abs) }
}

export function loadLatestBriefPreview(): DossierPreview | null {
  const dir = defaultIntelligenceDossierDir()
  const jsonPath = resolveLatestIntelligenceDossierJson(dir)
  if (!jsonPath || !existsSync(jsonPath)) return null
  return parseDossierJson(jsonPath)
}
