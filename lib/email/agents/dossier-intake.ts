import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { EmailIntakePayload } from '@/lib/email/agents/types'
import { jdaiContentEngineRoot } from '@/lib/email/agents/load-env'
import {
  fetchDailyBriefSnapshot,
  publishDailyBriefSnapshot,
} from '@/lib/email/agents/intake-snapshot'
import {
  intakeFromIntelligenceDossierJson,
  resolveLatestIntelligenceDossierJson,
} from '@/lib/intelligence/load-dossier'

function extractSection(md: string, heading: string): string {
  const re = new RegExp(`## ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n## |$)`, 'i')
  const m = md.match(re)
  return m ? m[0] : ''
}

function extractTableField(section: string, fieldLabel: string): string {
  const re = new RegExp(`\\*\\*${fieldLabel}\\*\\*\\s*\\|\\s*([^|\\n]+)`, 'i')
  const m = section.match(re)
  return m?.[1]?.trim() ?? ''
}

export function extractExecutiveRead(md: string): string {
  const block = extractSection(md, 'Executive Read')
  const lines = block
    .split('\n')
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean)
  return lines.join(' ').trim()
}

function extractRecommendedAction(md: string): string {
  const narrative = extractSection(md, 'Narrative Influence')
  const fromNarrative = extractTableField(narrative, 'Belief migration mechanism')
  if (fromNarrative) return fromNarrative

  const angle = extractSection(md, 'Content Angle')
  const resolution = angle.match(/\*\*Resolution:\*\*\s*(.+)/i)?.[1]?.trim()
  if (resolution) return resolution

  const hook = angle.match(/\*\*Hook:\*\*\s*(.+)/i)?.[1]?.trim()
  return hook ?? 'Review today\'s intelligence in ACCESS.'
}

function extractProductTip(md: string): string {
  const angle = extractSection(md, 'Content Angle')
  const hook = angle.match(/\*\*Hook:\*\*\s*(.+)/i)?.[1]?.trim()
  if (hook) return hook

  const positioning = extractSection(md, 'Positioning Opportunity')
  const stmt = positioning.match(/\*\*Opportunity statement:\*\*\s*(.+)/i)?.[1]?.trim()
  return stmt ?? 'Open ACCESS for your command brief and workflow tools.'
}

export function parseDossierToIntakePayload(
  dossierPath: string,
  options?: { handle?: string; systemStatus?: string }
): EmailIntakePayload {
  const md = readFileSync(dossierPath, 'utf8')
  const slugMatch = md.match(/topic slug[`:\s]*`?([^`\n]+)`?/i)
  const dateMatch = dossierPath.match(/(\d{4}-\d{2}-\d{2})/)

  return {
    source_type: 'jdai_dossier',
    source_path: dossierPath,
    source_id: slugMatch?.[1]?.trim() ?? dateMatch?.[1] ?? 'dossier',
    payload: {
      handle: options?.handle ?? process.env.ACCESS_DAILY_BRIEF_HANDLE ?? 'jdwhite.access',
      system_status: options?.systemStatus ?? 'ACCESS intelligence cycle complete. Systems nominal.',
      intelligence_summary: extractExecutiveRead(md),
      recommended_action: extractRecommendedAction(md),
      product_tip: extractProductTip(md),
    },
  }
}

function intelligenceDossierDir(root = jdaiContentEngineRoot()): string {
  return join(root, 'intelligence', 'dossiers')
}

export function resolveLatestIntelligenceDossierPath(root = jdaiContentEngineRoot()): string | null {
  return resolveLatestIntelligenceDossierJson(intelligenceDossierDir(root))
}

type ManifestCycle = {
  dossierPath?: string
  highestSignalScore?: number
  topicSlug?: string
}

export function resolveLatestDossierPath(root = jdaiContentEngineRoot()): string | null {
  const jsonPath = resolveLatestIntelligenceDossierPath(root)
  if (jsonPath) return jsonPath

  const manifestPath = join(root, 'manifest.json')
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
        dailyFolders?: { cycles?: ManifestCycle[] }[]
      }
      const cycles = manifest.dailyFolders?.flatMap((d) => d.cycles ?? []) ?? []
      const withDossier = cycles.filter((c) => c.dossierPath)
      if (withDossier.length) {
        withDossier.sort(
          (a, b) => (b.highestSignalScore ?? 0) - (a.highestSignalScore ?? 0)
        )
        const rel = withDossier[0].dossierPath!
        const abs = resolve(root, rel)
        if (existsSync(abs)) return abs
      }
    } catch {
      /* fall through to directory scan */
    }
  }

  const dossiersDir = join(root, 'dossiers')
  if (!existsSync(dossiersDir)) return null

  const files = readdirSync(dossiersDir)
    .filter((f) => f.endsWith('-DOSSIER.md'))
    .map((f) => join(dossiersDir, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)

  return files[0] ?? null
}

function buildIntakeFromPath(
  dossierPath: string,
  options?: { handle?: string }
): EmailIntakePayload {
  const abs = resolve(dossierPath)
  if (abs.endsWith('.json')) {
    return intakeFromIntelligenceDossierJson(abs)
  }
  return parseDossierToIntakePayload(abs, { handle: options?.handle })
}

export function buildDailyBriefIntakeFromLatest(options?: {
  dossierPath?: string
  handle?: string
}): { intake: EmailIntakePayload; dossierPath: string } {
  const root = jdaiContentEngineRoot()
  const dossierPath =
    options?.dossierPath ??
    resolveLatestDossierPath(root) ??
    (() => {
      throw new Error(`No dossier found under ${root}/intelligence/dossiers, dossiers/, or manifest.json`)
    })()

  const abs = resolve(dossierPath)
  if (!existsSync(abs)) {
    throw new Error(`Dossier not found: ${abs}`)
  }

  return {
    dossierPath: abs,
    intake: buildIntakeFromPath(abs, { handle: options?.handle }),
  }
}

export type DailyBriefIntakeSource = 'filesystem' | 'supabase_snapshot'

/** Filesystem when available; Supabase snapshot for Vercel cron (no monorepo on server). */
export async function resolveDailyBriefIntake(options?: {
  dossierPath?: string
  handle?: string
  publishSnapshot?: boolean
}): Promise<{
  intake: EmailIntakePayload
  dossierPath: string
  source: DailyBriefIntakeSource
}> {
  if (options?.dossierPath) {
    const built = buildDailyBriefIntakeFromLatest(options)
    if (options.publishSnapshot !== false) {
      await publishDailyBriefSnapshot({
        intake: built.intake,
        dossier_path: built.dossierPath,
      })
    }
    return { ...built, source: 'filesystem' }
  }

  const root = jdaiContentEngineRoot()
  const localPath = resolveLatestDossierPath(root)
  if (localPath && existsSync(resolve(localPath))) {
    const built = buildDailyBriefIntakeFromLatest({ ...options, dossierPath: localPath })
    if (options?.publishSnapshot !== false) {
      await publishDailyBriefSnapshot({
        intake: built.intake,
        dossier_path: built.dossierPath,
      })
    }
    return { ...built, source: 'filesystem' }
  }

  const snapshot = await fetchDailyBriefSnapshot()
  if (snapshot) {
    return {
      intake: snapshot.intake,
      dossierPath: snapshot.dossier_path ?? snapshot.intake.source_path ?? 'supabase:snapshot',
      source: 'supabase_snapshot',
    }
  }

  throw new Error(
    'No daily brief intake source: dossier missing locally and no Supabase snapshot. Run npm run intelligence:run -- --publish from access-app.'
  )
}
