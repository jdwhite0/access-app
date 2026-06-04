import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { listVaults } from '@/lib/actions/vaults'
import {
  isVaultIntelligenceEnabled,
  resolveJdCommandVaultFromRows,
} from '@/lib/jyson/resolve-founder-vault-path'
import {
  retrieveVaultContextForQuery,
  VAULT_VECTOR_INDEX_STATUS,
} from '@/lib/jyson/vault-context'
import { createSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

/**
 * POST /api/jyson/vault/context
 * Body: { query: string }
 * Returns ranked vault excerpts (local index preferred; cloud Supabase on Vercel).
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isVaultIntelligenceEnabled()) {
    return NextResponse.json(
      {
        error: 'Vault content intelligence is not enabled for this deployment.',
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
  const resolved = resolveJdCommandVaultFromRows(vaults)

  if (!resolved.vaultId && !resolved.path) {
    return NextResponse.json(
      {
        error: 'JD Command Vault not registered or not indexed.',
        source: resolved.source,
      },
      { status: 404 },
    )
  }

  const { block, chunkCount, indexMissing, source } = await retrieveVaultContextForQuery({
    query,
    clerkUserId: userId,
    vaultRoot: resolved.path,
    vaultId: resolved.vaultId,
    supabase: createSupabaseAdmin(),
    vaultLabel: resolved.name ?? undefined,
  })

  return NextResponse.json(
    {
      ok: true,
      vaultRoot: resolved.path,
      vaultId: resolved.vaultId,
      source: resolved.source,
      retrievalSource: source,
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
    localIndexCommand: 'npm run jyson:vault:index',
    cloudStore: 'vault_chunks (Supabase)',
    rebuildApi: 'POST /api/vault/index/rebuild',
  })
}
