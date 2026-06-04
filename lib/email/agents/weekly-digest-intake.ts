import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { EmailIntakePayload } from '@/lib/email/agents/types'
import { jdaiContentEngineRoot } from '@/lib/email/agents/load-env'
import { extractExecutiveRead } from '@/lib/email/agents/dossier-intake'

function readDossierHighlights(dossierPath: string): string {
  try {
    const md = readFileSync(dossierPath, 'utf8')
    const summary = extractExecutiveRead(md)
    const slug = dossierPath.match(/(\d{4}-\d{2}-\d{2})-(.+)-DOSSIER\.md$/)?.[2]?.replace(/-/g, ' ')
    const label = slug ? slug.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Intelligence cycle'
    return summary ? `${label}: ${summary.slice(0, 220)}` : label
  } catch {
    return 'Intelligence cycle complete'
  }
}

export function buildWeeklyDigestIntakeFromManifest(options?: {
  handle?: string
  maxHighlights?: number
}): EmailIntakePayload {
  const root = jdaiContentEngineRoot()
  const dossiersDir = join(root, 'dossiers')
  const highlights: string[] = []

  if (existsSync(dossiersDir)) {
    const files = readdirSync(dossiersDir)
      .filter((f) => f.endsWith('-DOSSIER.md'))
      .map((f) => join(dossiersDir, f))
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
      .slice(0, options?.maxHighlights ?? 5)

    for (const file of files) {
      highlights.push(readDossierHighlights(file))
    }
  }

  const weekOf = new Date().toISOString().slice(0, 10)

  return {
    source_type: 'jdai_dossier',
    source_id: `weekly-digest-${weekOf}`,
    payload: {
      email_type: 'weekly_digest',
      handle: options?.handle ?? process.env.ACCESS_DAILY_BRIEF_HANDLE ?? 'jdwhite.access',
      week_summary: `Your ACCESS weekly intelligence wrap-up for the week of ${weekOf}.`,
      highlights: highlights.length ? highlights : ['Review the latest dossiers in ACCESS Intelligence.'],
      strongest_signals: highlights,
    },
  }
}
