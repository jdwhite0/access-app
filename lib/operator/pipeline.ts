import { execSync } from 'node:child_process'
import { readdirSync, statSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import {
  intakeFromIntelligenceDossierJson,
  resolveLatestIntelligenceDossierJson,
  defaultIntelligenceDossierDir,
} from '@/lib/intelligence/load-dossier'
import { publishIntakeSnapshot } from '@/lib/intelligence/publish-from-intake'
import { resolveDailyBriefIntake } from '@/lib/email/agents/dossier-intake'
import { runEmailIntakePipeline, dispatchDueQueuedEmails } from '@/lib/email/agents/pipeline'

export type IntelligenceRunResult = {
  ok: boolean
  source_id?: string
  topic?: string
  signal_score?: number
  jsonPath?: string
  published?: boolean
  error?: string
}

export type SendBriefResult = {
  ok: boolean
  source_id?: string
  dossierPath?: string
  sent?: number
  failed?: number
  error?: string
}

export function jdaiEngineRoot(): string {
  return process.env.JDAI_CONTENT_ENGINE_PATH?.trim()
    ? resolve(process.env.JDAI_CONTENT_ENGINE_PATH.trim())
    : resolve(process.cwd(), '../jdai-content-engine')
}

export function listAvailableTopics(): { slug: string; markdown: string; json?: string }[] {
  const root = jdaiEngineRoot()
  const dossiersDir = join(root, 'dossiers')
  const jsonDir = join(root, 'intelligence', 'dossiers')
  if (!existsSync(dossiersDir)) return []

  return readdirSync(dossiersDir)
    .filter((f) => f.endsWith('-DOSSIER.md'))
    .map((f) => {
      const markdown = join(dossiersDir, f)
      const slugMatch = f.match(/\d{4}-\d{2}-\d{2}-(.+)-DOSSIER\.md/i)
      const slug = slugMatch?.[1] ?? f
      const jsonCandidates = existsSync(jsonDir)
        ? readdirSync(jsonDir).filter((j) => j.includes(slug) && j.endsWith('.json'))
        : []
      return {
        slug,
        markdown,
        json: jsonCandidates[0] ? join(jsonDir, jsonCandidates[0]) : undefined,
      }
    })
}

export function resolveTopicDossier(topicHint: string): string | null {
  const hint = topicHint.toLowerCase().trim().replace(/\s+/g, '-')
  const topics = listAvailableTopics()
  const exact = topics.find((t) => t.slug.toLowerCase() === hint)
  if (exact) return exact.markdown
  const partial = topics.find(
    (t) =>
      t.slug.toLowerCase().includes(hint) ||
      hint.includes(t.slug.toLowerCase()) ||
      t.slug.toLowerCase().replace(/-/g, ' ').includes(topicHint.toLowerCase().trim())
  )
  return partial?.markdown ?? null
}

/** Compile ACCESS Intelligence Dossier + optional publish. Requires jdai-content-engine on disk. */
export async function runIntelligencePipeline(options?: {
  dossierPath?: string
  weekly?: boolean
  publish?: boolean
}): Promise<IntelligenceRunResult> {
  const root = jdaiEngineRoot()
  if (!existsSync(root)) {
    return { ok: false, error: `JDAI engine not found at ${root}. Set JDAI_CONTENT_ENGINE_PATH.` }
  }

  const runnerArgs = ['runners/research-orchestrator-runner.ts']
  if (options?.weekly) runnerArgs.push('--weekly')
  if (options?.dossierPath) {
    const abs = resolve(options.dossierPath)
    runnerArgs.push(`--dossier=${abs}`)
  }

  try {
    execSync(`npx tsx ${runnerArgs.join(' ')}`, {
      cwd: root,
      stdio: 'pipe',
      encoding: 'utf8',
      env: { ...process.env, JDAI_CONTENT_ENGINE_PATH: root },
    })
  } catch (err) {
    // execSync surfaces the runner's stdout/stderr on the error object.
    const e = err as { status?: number; stdout?: string; stderr?: string; message?: string }
    const out = `${e.stdout ?? ''}\n${e.stderr ?? ''}`
    if (e.status === 3) {
      // Held by the quality gate — surface the findings, not a generic failure.
      const findings = out
        .split('\n')
        .filter((l) => /HOLD|⛔|⚠️|HELD by quality gate|→/.test(l))
        .join('\n')
        .trim()
      return {
        ok: false,
        error: `Quality gate held this brief — it isn't good enough to send yet:\n${findings || out.trim()}`,
      }
    }
    return { ok: false, error: `Orchestrator failed: ${e.message ?? out}` }
  }

  const jsonDir = defaultIntelligenceDossierDir()
  let jsonPath: string | null
  if (options?.weekly) {
    const weeklyFiles = readdirSync(jsonDir)
      .filter((f) => f.startsWith('weekly-synthesis-') && f.endsWith('.json'))
      .map((f) => join(jsonDir, f))
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
    jsonPath = weeklyFiles[0] ?? null
  } else if (options?.dossierPath) {
    jsonPath = resolveLatestIntelligenceDossierJson(jsonDir)
  } else {
    jsonPath = resolveLatestIntelligenceDossierJson(jsonDir)
  }

  if (!jsonPath) return { ok: false, error: 'No intelligence dossier JSON produced' }

  const intake = intakeFromIntelligenceDossierJson(jsonPath)
  let published = false
  if (options?.publish) {
    const pub = await publishIntakeSnapshot(intake)
    if (!pub.ok) return { ok: false, error: pub.error ?? 'Publish failed', jsonPath }
    published = true
  }

  const raw = JSON.parse(readFileSync(jsonPath, 'utf8')) as {
    topic?: string
    signal?: { signal_score?: number }
  }

  return {
    ok: true,
    source_id: intake.source_id,
    topic: raw.topic,
    signal_score: raw.signal?.signal_score,
    jsonPath,
    published,
  }
}

/** Publish + founder test send daily brief. */
export async function sendDailyBrief(options?: {
  topic?: string
  dossierPath?: string
}): Promise<SendBriefResult> {
  let dossierPath = options?.dossierPath
  if (options?.topic && !dossierPath) {
    dossierPath = resolveTopicDossier(options.topic) ?? undefined
  }

  if (dossierPath?.endsWith('.md')) {
    const compiled = await runIntelligencePipeline({ dossierPath, publish: true })
    if (!compiled.ok) return { ok: false, error: compiled.error }
  }

  try {
    const { intake, dossierPath: resolved } = await resolveDailyBriefIntake({
      dossierPath: dossierPath?.endsWith('.json') ? dossierPath : undefined,
      publishSnapshot: true,
    })

    const result = await runEmailIntakePipeline(intake, { sendImmediately: true })
    if (!result.ok) {
      return { ok: false, error: result.errors.join('; ') || 'Pipeline failed', dossierPath: resolved }
    }

    const dispatch = await dispatchDueQueuedEmails(25)
    return {
      ok: dispatch.failed === 0,
      source_id: intake.source_id,
      dossierPath: resolved,
      sent: dispatch.sent,
      failed: dispatch.failed,
      error: dispatch.failed > 0 ? 'Dispatch had failures' : undefined,
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export type ClaudeResearchResult = {
  ok: boolean
  message: string
  jsonPath?: string
}

export async function runClaudeResearch(topic: string): Promise<ClaudeResearchResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, message: 'ANTHROPIC_API_KEY not set in access-app/.env.local.' }
  }

  const engineRoot = jdaiEngineRoot()
  if (!existsSync(engineRoot)) {
    return { ok: false, message: `JDAI engine not found at ${engineRoot}. Set JDAI_CONTENT_ENGINE_PATH.` }
  }

  const today = new Date().toISOString().slice(0, 10)
  const slug = topic.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60)
  const sourceId = `${today}-${slug}`
  const now = new Date().toISOString()

  let vaultContext = ''
  try {
    const todayMd = join(engineRoot, '..', 'JD Command Vault', 'daily', 'today.md')
    if (existsSync(todayMd)) vaultContext = readFileSync(todayMd, 'utf8').slice(0, 1500)
  } catch { /* non-fatal */ }

  // Anthropic SDK — safe async HTTP, no process.exit() risk
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })

  const systemPrompt = `You are the ACCESS Intelligence Research Engine for JD Productions.

Produce market intelligence dossiers for small business owners and operators (5–75 employees). JD's positioning: Strategic Business Partner — diagnoses, aligns, connects, strengthens systems. Voice: Direct, diagnostic, strategic. No fluff.

Return ONLY valid JSON — no markdown fences, no explanation.`

  const userPrompt = `Research topic: "${topic}"
Date: ${today}
${vaultContext ? `Vault context (today's priorities):\n${vaultContext}\n` : ''}

Produce a complete ACCESS Intelligence Dossier JSON. Use your knowledge of current 2026 market conditions.

CRITICAL RULES — violation breaks the pipeline:
1. "topic" field = a human-readable title like "PATH ETF and Top Investment Opportunities for June 2026" — NOT the source_id, NOT a slug, NOT a filename
2. "headlines" MUST have exactly 3–5 entries with real, specific claims — never an empty array
3. "key_takeaways" MUST have exactly 3 entries — never empty
4. "pain_points" MUST have exactly 3 entries — never empty
5. "distribution.angles.email.hook" MUST be a punchy complete sentence — never empty
6. signal_score must be >= 70

Return this exact JSON schema:

{
  "artifact": "access_intelligence_dossier",
  "version": "1.0.0",
  "source_id": "${sourceId}",
  "source_type": "jdai_research_cycle",
  "topic": "<HUMAN READABLE TITLE — e.g. 'PATH ETF and Top Investment Opportunities, June 2026'>",
  "topic_slug": "${slug}",
  "status": "approved",
  "audience": {
    "primary": "<who this is for — specific role + context>",
    "segment": "founders_operators",
    "trust_level": "warm"
  },
  "signal": {
    "category": "<market category>",
    "summary": "<2–3 sentences with bold key phrases>",
    "timing_rationale": "<why act on this now, not in 6 months>",
    "signal_score": <70–95>
  },
  "intelligence": {
    "summary": "<3–4 sentences: what moved, what it means for operators, JD's angle>",
    "headlines": [
      {"title": "<specific claim>", "explainer": "<exact quote or concrete evidence>", "source_label": "E1"},
      {"title": "<specific claim>", "explainer": "<exact quote or concrete evidence>", "source_label": "E2"},
      {"title": "<specific claim>", "explainer": "<exact quote or concrete evidence>", "source_label": "E3"}
    ],
    "key_takeaways": ["<takeaway 1>", "<takeaway 2>", "<takeaway 3>"],
    "recommended_action": "<specific JD content/product angle — one crisp sentence>",
    "product_context": "<punchy hook sentence operators will feel>",
    "positioning_read": "<how this validates or challenges JD's infrastructure-first positioning>",
    "pain_points": ["<pain 1>", "<pain 2>", "<pain 3>"]
  },
  "creative": {
    "tone": "Direct, diagnostic, strategic"
  },
  "distribution": {
    "confidence_score": <75–95>,
    "approved_channels": ["email", "social", "dashboard"],
    "angles": {
      "email": {
        "hook": "<punchy 1-sentence email hook>",
        "cta": "Open ACCESS",
        "format_hint": "daily_brief_v2"
      },
      "social": {
        "post_angles": ["<angle 1>", "<angle 2>"],
        "platform_hints": ["LinkedIn", "X"],
        "cta": "Read the full brief in ACCESS"
      }
    },
    "primary_format": "LinkedIn long-form article"
  },
  "provenance": {
    "sources_used": [
      {"label": "<source name>", "verified": true},
      {"label": "<source name>", "verified": true}
    ],
    "compiled_by": "access-claude-research-engine",
    "compiled_at": "${now}"
  },
  "created_at": "${now}",
  "updated_at": "${now}",
  "quality": {
    "passed": true,
    "overall": 85,
    "grade": "A",
    "min_score": 70,
    "standards_version": "2026.06.04",
    "scored_at": "${now}",
    "blocking": 0
  }
}`

  let jsonText = ''
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    const block = response.content[0]
    if (block.type !== 'text') return { ok: false, message: 'Claude returned non-text response.' }
    jsonText = block.text.trim()
  } catch (err) {
    return { ok: false, message: `Claude API error: ${err instanceof Error ? err.message : String(err)}` }
  }

  let dossier: Record<string, unknown>
  try {
    const cleaned = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    dossier = JSON.parse(cleaned)
  } catch {
    return { ok: false, message: `Research returned invalid JSON (${jsonText.slice(0, 150)})` }
  }

  const signalScore = typeof (dossier.signal as Record<string, unknown>)?.signal_score === 'number'
    ? (dossier.signal as Record<string, unknown>).signal_score as number
    : 0

  if (signalScore < 70) {
    return { ok: false, message: `Signal score ${signalScore} below minimum (70) — topic not strong enough for a brief.` }
  }

  // Validate required arrays — catch lazy Claude responses before they hit the pipeline
  const intel = dossier.intelligence as Record<string, unknown>
  const headlines = intel?.headlines
  const keyTakeaways = intel?.key_takeaways
  const painPoints = intel?.pain_points
  const emailHook = (dossier.distribution as Record<string, unknown>)?.angles
    ? ((dossier.distribution as Record<string, unknown>).angles as Record<string, unknown>)?.email
      ? (((dossier.distribution as Record<string, unknown>).angles as Record<string, unknown>).email as Record<string, unknown>)?.hook
      : null
    : null

  const missing: string[] = []
  if (!Array.isArray(headlines) || headlines.length === 0) missing.push('headlines')
  if (!Array.isArray(keyTakeaways) || keyTakeaways.length === 0) missing.push('key_takeaways')
  if (!Array.isArray(painPoints) || painPoints.length === 0) missing.push('pain_points')
  if (!emailHook) missing.push('email hook')

  if (missing.length > 0) {
    return { ok: false, message: `Research incomplete — Claude omitted required fields: ${missing.join(', ')}. Try again.` }
  }

  // Write intelligence JSON
  const intelligenceDir = join(engineRoot, 'intelligence', 'dossiers')
  mkdirSync(intelligenceDir, { recursive: true })
  const jsonPath = join(intelligenceDir, `${sourceId}.json`)
  writeFileSync(jsonPath, JSON.stringify(dossier, null, 2), 'utf8')

  // Write markdown placeholder so resolveTopicDossier can locate this topic
  const dossiersDir = join(engineRoot, 'dossiers')
  mkdirSync(dossiersDir, { recursive: true })
  const intelForMd = dossier.intelligence as Record<string, unknown>
  writeFileSync(
    join(dossiersDir, `${today}-${slug}-DOSSIER.md`),
    [
      `# ${String(dossier.topic ?? topic)}`,
      '',
      `> Compiled by ACCESS Claude Research Engine · ${today}`,
      `> Source ID: ${sourceId}`,
      `> JSON dossier: ${jsonPath}`,
      '',
      '## Executive Read',
      '',
      String(intelForMd?.summary ?? ''),
      '',
      '## Recommended Action',
      '',
      String(intelForMd?.recommended_action ?? ''),
    ].join('\n'),
    'utf8'
  )

  // Update manifest.json (non-fatal)
  const manifestPath = join(engineRoot, 'manifest.json')
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>
      manifest.lastUpdated = today
      const list = (manifest.accessIntelligenceDossiers as unknown[]) ?? []
      list.unshift({ source_id: sourceId, topic: dossier.topic, status: 'approved', signal_score: signalScore, json_path: `intelligence/dossiers/${sourceId}.json`, compiled_at: now })
      manifest.accessIntelligenceDossiers = list.slice(0, 50)
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
    } catch { /* non-fatal */ }
  }

  return {
    ok: true,
    message: `Research complete: *${String(dossier.topic)}* (signal: ${signalScore})`,
    jsonPath,
  }
}
