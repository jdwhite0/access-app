import { createHash } from 'node:crypto'

export type SyncPlanRow = {
  objectType: string
  action: string
  name: string
  sourcePath: string
  sourceRef: string
  sourceKind: string
  contentHash?: string
  reason?: string
}

export type ApprovedSyncPlan = {
  vaultKey: string
  identityHandle: string
  planned: SyncPlanRow[]
}

const FORBIDDEN_PATH = [
  /^\.env/i,
  /node_modules/i,
  /\.git\//i,
  /\.next\//i,
  /\.vercel\//i,
  /secret/i,
  /credentials/i,
  /\.pem$/i,
  /\.key$/i,
]

const MAX_NAME_LEN = 500
const MAX_PATH_LEN = 1024
const MAX_ROWS = 2000

export function computeContentHash(row: {
  sourcePath: string
  name: string
  objectType: string
  sizeBytes?: number
  modifiedAt?: string
}): string {
  return createHash('sha256')
    .update(
      `${row.objectType}:${row.sourcePath}:${row.name}:${row.sizeBytes ?? 0}:${row.modifiedAt ?? ''}`
    )
    .digest('hex')
    .slice(0, 64)
}

export function validateApprovedSyncPlan(
  plan: unknown,
  expectedVaultKey: string
): { ok: true; plan: ApprovedSyncPlan } | { ok: false; error: string } {
  if (!plan || typeof plan !== 'object') {
    return { ok: false, error: 'Plan must be an object.' }
  }

  const p = plan as Record<string, unknown>
  const vaultKey = String(p.vaultKey ?? '')
  const identityHandle = String(p.identityHandle ?? '')

  if (vaultKey !== expectedVaultKey) {
    return { ok: false, error: 'Plan vaultKey does not match device vault.' }
  }

  if (!identityHandle) {
    return { ok: false, error: 'Plan missing identityHandle.' }
  }

  const rawPlanned = p.planned
  if (!Array.isArray(rawPlanned)) {
    return { ok: false, error: 'Plan missing planned array.' }
  }

  if (rawPlanned.length > MAX_ROWS) {
    return { ok: false, error: `Plan exceeds max rows (${MAX_ROWS}).` }
  }

  const planned: SyncPlanRow[] = []

  for (const item of rawPlanned) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    if (row.action !== 'would_upsert') continue

    const objectType = String(row.objectType ?? '')
    if (objectType === 'skip') continue

    const sourcePath = String(row.sourcePath ?? '')
    const name = String(row.name ?? '')
    const sourceRef = String(row.sourceRef ?? '')

    if (!sourceRef || sourceRef.length > 64) {
      return { ok: false, error: 'Invalid source_ref.' }
    }

    if (sourcePath.includes(':\\') || sourcePath.startsWith('/Users/')) {
      return { ok: false, error: 'Absolute paths are not allowed.' }
    }

    if (FORBIDDEN_PATH.some((re) => re.test(sourcePath))) {
      return { ok: false, error: `Forbidden path: ${sourcePath}` }
    }

    if (name.length > MAX_NAME_LEN || sourcePath.length > MAX_PATH_LEN) {
      return { ok: false, error: 'Metadata field too large.' }
    }

    planned.push({
      objectType,
      action: 'would_upsert',
      name,
      sourcePath,
      sourceRef,
      sourceKind: String(row.sourceKind ?? 'vault_import'),
      contentHash: row.contentHash ? String(row.contentHash) : computeContentHash({
        sourcePath,
        name,
        objectType,
      }),
      reason: row.reason ? String(row.reason) : undefined,
    })
  }

  if (!planned.length) {
    return { ok: false, error: 'No upsert rows in plan.' }
  }

  return {
    ok: true,
    plan: { vaultKey, identityHandle, planned },
  }
}
