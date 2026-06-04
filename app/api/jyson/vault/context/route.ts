import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { listVaults } from '@/lib/actions/vaults'
import {
  isVaultIntelligenceEnabled,
  resolveFounderVaultPathFromRows,
} from '@/lib/jyson/resolve-founder-vault-path'
import {
  retrieveVaultContextForQuery,
  VAULT_VECTOR_INDEX_STATUS,
} from '@/lib/jyson/vault-context'

export const runtime = 'nodejs'

/**
 * POST /api/jyson/vault/context
 * Body: { query: string }
 * Returns ranked vault excerpts for JYSON (local founder machine only).
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isVaultIntelligenceEnabled()) {
    return NextResponse.json(
      {
        error: 'Vault content intelligence requires Private JYSON on your local machine.',
        mode: VAULT_VECTOR_INDEX_STATUS,
      },
      { status: 503 },
    )
  }

  let body: { query?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const query = body.query?.trim()
  if (!query) {
    return NextResponse.json({ error: 'query required' }, { status: 400 })
  }

  const vaults = await listVaults().catch(() => [])
  const { path, source } = resolveFounderVaultPathFromRows(vaults)

  if (!path) {
    return NextResponse.json(
      {
        error: 'JD Command Vault path not found on this machine.',
        source,
      },
      { status: 404 },
    )
  }

  const { block, chunkCount, indexMissing } = await retrieveVaultContextForQuery(path, query)

  return NextResponse.json(
    {
      ok: true,
      vaultRoot: path,
      source,
      chunkCount,
      indexMissing,
      contextBlock: block,
      mode: VAULT_VECTOR_INDEX_STATUS,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    enabled: isVaultIntelligenceEnabled(),
    mode: VAULT_VECTOR_INDEX_STATUS,
    indexCommand: 'npm run jyson:vault:index',
  })
}
