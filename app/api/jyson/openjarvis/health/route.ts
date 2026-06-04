import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { listVaults } from '@/lib/actions/vaults'
import { resolveIntelligenceCapabilities } from '@/lib/openjarvis/runtime-capabilities'
import { resolveJdCommandVaultFromRows } from '@/lib/jyson/resolve-founder-vault-path'
import { resolveOpenJarvisRuntimeState } from '@/lib/openjarvis/resolve-runtime-state'
import { countVaultChunksForVault } from '@/lib/vault/vault-chunks-store'
import { createSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

/**
 * GET /api/jyson/openjarvis/health
 * Private JYSON + OpenJarvis GET /health (+ connector status for sync, not for gating tools).
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const runtime = await resolveOpenJarvisRuntimeState()
  const vaults = await listVaults().catch(() => [])
  const resolved = resolveJdCommandVaultFromRows(vaults)
  let vaultCloudReady = false
  let vaultChunkCount = 0

  const supabase = createSupabaseAdmin()
  if (supabase && resolved.vaultId) {
    vaultChunkCount = await countVaultChunksForVault(supabase, resolved.vaultId, userId)
    vaultCloudReady = vaultChunkCount > 0
  }

  const capabilities = resolveIntelligenceCapabilities(runtime, { vaultCloudReady })
  return NextResponse.json(
    {
      ...runtime,
      runtime,
      capabilities,
      localToolsAvailable: runtime.localToolsAvailable,
      setupComplete: capabilities.setupComplete,
      recommendedAction: capabilities.recommendedAction,
      vaultCloudReady,
      vaultChunkCount,
      vaultId: resolved.vaultId,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
