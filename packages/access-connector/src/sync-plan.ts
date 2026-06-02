import { writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import type {
  AccessConnectorConfig,
  PlannedRegistryRow,
  RegistryObjectType,
  RegistrySyncPlan,
  VaultFileMetadata,
} from './types.js'
import { loadScanReportFiles } from './scan.js'

function sourceRef(vaultKey: string, relativePath: string, objectType: string): string {
  return createHash('sha256')
    .update(`${vaultKey}:${relativePath}:${objectType}`)
    .digest('hex')
    .slice(0, 32)
}

function contentHashForFile(file: VaultFileMetadata, vaultKey: string, objectType: string): string {
  return createHash('sha256')
    .update(`${vaultKey}:${file.relativePath}:${file.sizeBytes}:${file.modifiedAt}:${objectType}`)
    .digest('hex')
    .slice(0, 64)
}

function classifyFile(file: VaultFileMetadata, vaultKey: string): PlannedRegistryRow {
  const path = file.relativePath
  const name = basename(path, file.extension)

  if (path.includes('JD Command Vault/projects/') && /\/00_ADMIN\//i.test(path)) {
    const projectDir = path.split('/')[2] ?? name
    const objectType = 'system' as const
    return {
      objectType,
      action: 'would_upsert',
      name: projectDir,
      sourcePath: path,
      sourceRef: sourceRef(vaultKey, path, 'system'),
      sourceKind: 'vault_import',
      contentHash: contentHashForFile(file, vaultKey, objectType),
      reason: 'Project admin doc → system registry candidate',
    }
  }

  if (path.includes('JD Command Vault/projects/') && /_START_HERE\.md$/i.test(path)) {
    return {
      objectType: 'project',
      action: 'would_upsert',
      name: dirname(path).split('/').pop() ?? name,
      sourcePath: path,
      sourceRef: sourceRef(vaultKey, path, 'project'),
      sourceKind: 'vault_import',
      reason: 'Project start file → builder_project candidate',
    }
  }

  if (/command_center\/AGENT/i.test(path) || /AGENT_ROLES/i.test(path)) {
    return {
      objectType: 'agent',
      action: 'would_upsert',
      name: name.replace(/\.md$/i, ''),
      sourcePath: path,
      sourceRef: sourceRef(vaultKey, path, 'agent'),
      sourceKind: 'vault_import',
      reason: 'Agent doctrine doc',
    }
  }

  if (/command_center\/.*PROTOCOL/i.test(path) || path.includes('automations/')) {
    return {
      objectType: 'workflow',
      action: 'would_upsert',
      name: name.replace(/\.md$/i, ''),
      sourcePath: path,
      sourceRef: sourceRef(vaultKey, path, 'workflow'),
      sourceKind: 'vault_import',
      reason: 'Protocol / automation doc',
    }
  }

  if (/vault\/client_system/i.test(path)) {
    return {
      objectType: 'offer',
      action: 'would_upsert',
      name: name.replace(/\.md$/i, ''),
      sourcePath: path,
      sourceRef: sourceRef(vaultKey, path, 'offer'),
      sourceKind: 'vault_import',
      reason: 'Client system doc',
    }
  }

  if (/landing_page\/index\.html$/i.test(path)) {
    return {
      objectType: 'asset',
      action: 'would_upsert',
      name: 'JD System Portal',
      sourcePath: path,
      sourceRef: sourceRef(vaultKey, path, 'asset'),
      sourceKind: 'vault_import',
      reason: 'Public portal artifact',
    }
  }

  if (/\.sql$/i.test(path) && path.includes('supabase/')) {
    return {
      objectType: 'blueprint',
      action: 'would_upsert',
      name,
      sourcePath: path,
      sourceRef: sourceRef(vaultKey, path, 'blueprint'),
      sourceKind: 'vault_import',
      reason: 'Schema reference (metadata only)',
    }
  }

  return {
    objectType: 'skip',
    action: 'skip',
    name,
    sourcePath: path,
    sourceRef: sourceRef(vaultKey, path, 'skip'),
    sourceKind: 'vault_import',
    reason: 'No registry mapping in MVP plan',
  }
}

export function buildRegistrySyncPlan(input: {
  identityHandle: string
  vaultKey: string
  files: VaultFileMetadata[]
}): RegistrySyncPlan {
  const planned = input.files.map((f) => {
    const row = classifyFile(f, input.vaultKey)
    if (row.action === 'would_upsert' && !row.contentHash && row.objectType !== 'skip') {
      row.contentHash = contentHashForFile(f, input.vaultKey, row.objectType)
    }
    return row
  })
  const counts: Record<RegistryObjectType, number> = {
    system: 0,
    project: 0,
    agent: 0,
    blueprint: 0,
    workflow: 0,
    asset: 0,
    offer: 0,
    skip: 0,
  }

  for (const row of planned) {
    counts[row.objectType] += 1
  }

  return {
    mode: 'sync-plan',
    generatedAt: new Date().toISOString(),
    identityHandle: input.identityHandle,
    vaultKey: input.vaultKey,
    applyToCloud: false,
    planned: planned.filter((p) => p.action === 'would_upsert'),
    counts,
  }
}

export async function runSyncPlan(
  config: AccessConnectorConfig,
  reportPath?: string
): Promise<RegistrySyncPlan | { ok: false; error: string }> {
  const path = reportPath ?? resolve(process.cwd(), 'vault-scan-report.json')

  if (!existsSync(path)) {
    return {
      ok: false,
      error: `Scan report not found at ${path}. Run scan first.`,
    }
  }

  const files = loadScanReportFiles(path)
  if (files.length === 0) {
    return {
      ok: false,
      error: 'Scan report has no files. Run scan with ACCESS_VAULT_ROOT set.',
    }
  }

  const plan = buildRegistrySyncPlan({
    identityHandle: config.identityHandle,
    vaultKey: config.vaultKey,
    files,
  })

  const outPath = resolve(process.cwd(), 'registry-sync-plan.json')
  writeFileSync(outPath, JSON.stringify(plan, null, 2), 'utf8')

  return plan
}
