import { execSync, spawn } from 'node:child_process'
import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs'
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

export async function runCursorResearch(topic: string): Promise<{ ok: boolean; message: string }> {
  const apiKey = process.env.CURSOR_API_KEY?.trim()
  if (!apiKey) {
    return {
      ok: false,
      message:
        'CURSOR_API_KEY not set. Add it to access-app/.env.local to enable research-from-Slack, or run research in this Cursor chat.',
    }
  }

  const monorepoRoot = resolve(process.cwd(), '..')
  const prompt = `Run the JDAI Content Intelligence cycle for topic: "${topic}".

Follow jdai-content-engine/architecture/intelligence-pipeline.md and .cursor/skills/jdai-content-intelligence/SKILL.md.

Steps:
1. Read JD Command Vault/daily/today.md
2. Create research under jdai-content-engine/research/
3. Write approved dossier to jdai-content-engine/dossiers/YYYY-MM-DD-{slug}-DOSSIER.md
4. Update manifest.json
5. Run compile: from access-app, npm run intelligence:run -- --publish on the new dossier

Signal must be >= 70. Reply with dossier path when done.`

  // Run in an isolated child process — the Cursor SDK can call process.exit() on
  // failure, which would kill the bot. Spawning a worker means only the worker dies.
  const workerScript = join(process.cwd(), 'scripts', 'cursor-research-worker.ts')
  const tsxBin = join(process.cwd(), 'node_modules', '.bin', 'tsx')
  const inputArg = JSON.stringify({ prompt, apiKey, cwd: monorepoRoot })
  const TIMEOUT_MS = 3 * 60_000 // 3-minute hard ceiling

  return new Promise((resolve) => {
    let settled = false
    const settle = (result: { ok: boolean; message: string }) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }

    const child = spawn(tsxBin, [workerScript, inputArg], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    })

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      settle({ ok: false, message: `Research timed out after ${TIMEOUT_MS / 60_000} minutes.` })
    }, TIMEOUT_MS)

    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (d: Buffer) => { stdout += d.toString() })
    child.stderr?.on('data', (d: Buffer) => { stderr += d.toString() })

    child.on('close', (code: number | null) => {
      if (stdout.trim()) {
        try {
          settle(JSON.parse(stdout.trim()) as { ok: boolean; message: string })
          return
        } catch { /* fall through */ }
      }
      const errDetail = stderr.trim().slice(0, 400) || `exited with code ${code}`
      settle({ ok: false, message: `Research worker failed: ${errDetail}` })
    })

    child.on('error', (err: Error) => {
      settle({ ok: false, message: `Could not start research worker: ${err.message}` })
    })
  })
}
