import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import type { AccessConnectorConfig, CompileSummary } from './types.js'
import { loadScanReportFiles } from './scan.js'
import { buildRegistrySyncPlan } from './sync-plan.js'

export function compileFromScanReport(
  config: AccessConnectorConfig,
  reportPath: string
): CompileSummary | { ok: false; error: string } {
  if (!existsSync(reportPath)) {
    return { ok: false, error: `Scan report not found: ${reportPath}` }
  }

  const files = loadScanReportFiles(reportPath)
  if (!files.length) {
    return { ok: false, error: 'Scan report has no files.' }
  }

  const plan = buildRegistrySyncPlan({
    identityHandle: config.identityHandle,
    vaultKey: config.vaultKey,
    files,
  })

  const candidates = {
    systems: plan.counts.system,
    projects: plan.counts.project,
    agents: plan.counts.agent,
    blueprints: plan.counts.blueprint,
    workflows: plan.counts.workflow,
    assets: plan.counts.asset,
    offers: plan.counts.offer,
    skipped: plan.counts.skip,
  }

  return {
    mode: 'compile',
    compiledAt: new Date().toISOString(),
    identityHandle: config.identityHandle,
    vaultKey: config.vaultKey,
    candidates,
    topCandidates: plan.planned.slice(0, 50),
  }
}

export type CompileCommandReport = {
  mode: 'compile'
  ok: boolean
  error: string | null
  outputPath: string | null
  summary: CompileSummary | null
}

export async function runCompile(
  config: AccessConnectorConfig,
  options?: { reportPath?: string; outPath?: string }
): Promise<CompileCommandReport> {
  const reportPath =
    options?.reportPath ?? resolve(process.cwd(), 'vault-scan-report.json')

  const compiled = compileFromScanReport(config, reportPath)
  if ('ok' in compiled) {
    return {
      mode: 'compile',
      ok: false,
      error: compiled.error,
      outputPath: null,
      summary: null,
    }
  }

  const outPath =
    options?.outPath ?? resolve(process.cwd(), 'vault-compile-summary.json')

  writeFileSync(outPath, JSON.stringify(compiled, null, 2), 'utf8')

  return {
    mode: 'compile',
    ok: true,
    error: null,
    outputPath: outPath,
    summary: compiled,
  }
}
