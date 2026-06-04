import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getVault } from '@/lib/actions/vaults'
import { resolveJdCommandVaultLocalPath, vaultRowScanPath } from '@/lib/vault/constants'
import { syncVaultContentToCloud } from '@/lib/vault/vault-cloud-index'
import { createSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

/**
 * POST /api/vault/index/rebuild
 * Body: { vaultId: string }
 * Rebuilds Supabase vault_chunks from the vault's local_path (founder machine / connector host).
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { vaultId?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const vaultId = body.vaultId?.trim()
  if (!vaultId) {
    return NextResponse.json({ error: 'vaultId required' }, { status: 400 })
  }

  const vault = await getVault(vaultId)
  if (!vault) {
    return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
  }

  const scanPath = vaultRowScanPath(vault.local_path)
  if (!scanPath) {
    return NextResponse.json({ error: 'No local path on vault row' }, { status: 400 })
  }

  const { scanPath: resolved } = resolveJdCommandVaultLocalPath(scanPath)
  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  const result = await syncVaultContentToCloud({
    supabase,
    vaultId,
    clerkUserId: userId,
    scanPath: resolved,
    logPrefix: '[api/vault/index/rebuild]',
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? 'Cloud index rebuild failed' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    ok: true,
    vaultId,
    chunkCount: result.chunkCount,
    fileCount: result.fileCount,
    stored: result.stored,
  })
}
