import type { SupabaseClient } from '@supabase/supabase-js'
import { buildVaultContentChunksFromRoot } from '@/lib/jyson/vault-context'
import { replaceVaultContentChunks } from '@/lib/vault/vault-chunks-store'

const LOG = '[vault-cloud-index]'

export type VaultCloudIndexResult = {
  ok: boolean
  error: string | null
  chunkCount: number
  fileCount: number
  stored: boolean
}

/**
 * Scan vault on disk, chunk content, and upsert into Supabase vault_chunks.
 * Caller must pass service-role supabase + verified vault ownership upstream.
 */
export async function syncVaultContentToCloud(input: {
  supabase: SupabaseClient
  vaultId: string
  clerkUserId: string
  scanPath: string
  logPrefix?: string
}): Promise<VaultCloudIndexResult> {
  const tag = input.logPrefix ?? LOG
  const scanPath = input.scanPath.trim()

  const built = await buildVaultContentChunksFromRoot(scanPath)
  if (!built.ok || !built.manifest) {
    console.error(`${tag} chunk build failed: ${built.error ?? 'unknown'}`)
    return {
      ok: false,
      error: built.error ?? 'Chunk build failed',
      chunkCount: 0,
      fileCount: 0,
      stored: false,
    }
  }

  const replaced = await replaceVaultContentChunks(
    input.supabase,
    input.vaultId,
    input.clerkUserId,
    built.chunks,
  )

  if (replaced.error) {
    console.error(`${tag} supabase replace failed: ${replaced.error}`)
    return {
      ok: false,
      error: replaced.error,
      chunkCount: built.chunks.length,
      fileCount: built.manifest.fileCount,
      stored: false,
    }
  }

  console.error(
    `${tag} ok vaultId=${input.vaultId} chunks=${replaced.chunkCount} files=${built.manifest.fileCount}`,
  )

  return {
    ok: true,
    error: null,
    chunkCount: replaced.chunkCount,
    fileCount: built.manifest.fileCount,
    stored: replaced.stored,
  }
}
