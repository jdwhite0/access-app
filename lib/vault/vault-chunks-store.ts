import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { VaultContentChunk } from '@/lib/jyson/vault-context'

let vaultChunksTableKnown: boolean | null = null

export type VaultChunkDbRow = {
  id: string
  vault_id: string
  clerk_user_id: string
  source_path: string
  chunk_index: number
  content: string
  token_estimate: number | null
  content_hash: string | null
  indexed_at: string
}

export async function vaultChunksTableExists(supabase: SupabaseClient): Promise<boolean> {
  if (vaultChunksTableKnown !== null) return vaultChunksTableKnown

  const { error } = await supabase.from('vault_chunks').select('id').limit(0)
  const msg = error?.message ?? ''
  if (
    error &&
    (error.code === '42P01' ||
      error.code === 'PGRST205' ||
      msg.includes('does not exist') ||
      msg.includes('schema cache'))
  ) {
    vaultChunksTableKnown = false
    return false
  }

  vaultChunksTableKnown = !error
  return vaultChunksTableKnown
}

/** Server-side: vault row must belong to clerk user before any chunk IO. */
export async function verifyVaultOwnedByClerk(
  supabase: SupabaseClient,
  vaultId: string,
  clerkUserId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('vaults')
    .select('id')
    .eq('id', vaultId)
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle()

  return !error && !!data
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
}

function hashContent(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

export async function countVaultChunksForVault(
  supabase: SupabaseClient,
  vaultId: string,
  clerkUserId: string,
): Promise<number> {
  const exists = await vaultChunksTableExists(supabase)
  if (!exists) return 0

  const owned = await verifyVaultOwnedByClerk(supabase, vaultId, clerkUserId)
  if (!owned) return 0

  const { count, error } = await supabase
    .from('vault_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('vault_id', vaultId)
    .eq('clerk_user_id', clerkUserId)

  if (error) return 0
  return count ?? 0
}

/** Replace all cloud chunks for a vault (delete + batch insert). */
export async function replaceVaultContentChunks(
  supabase: SupabaseClient,
  vaultId: string,
  clerkUserId: string,
  chunks: VaultContentChunk[],
): Promise<{ stored: boolean; error: string | null; chunkCount: number }> {
  const exists = await vaultChunksTableExists(supabase)
  if (!exists) {
    return { stored: false, error: null, chunkCount: 0 }
  }

  const owned = await verifyVaultOwnedByClerk(supabase, vaultId, clerkUserId)
  if (!owned) {
    return { stored: false, error: 'Vault not found for user', chunkCount: 0 }
  }

  const { error: delErr } = await supabase
    .from('vault_chunks')
    .delete()
    .eq('vault_id', vaultId)
    .eq('clerk_user_id', clerkUserId)

  if (delErr) return { stored: false, error: delErr.message, chunkCount: 0 }

  if (chunks.length === 0) {
    return { stored: true, error: null, chunkCount: 0 }
  }

  const indexed_at = new Date().toISOString()
  const rows = chunks.map((c) => ({
    vault_id: vaultId,
    clerk_user_id: clerkUserId,
    source_path: c.relativePath,
    chunk_index: c.chunkIndex,
    content: c.text,
    token_estimate: estimateTokens(c.text),
    content_hash: hashContent(c.text),
    indexed_at,
  }))

  const chunkSize = 200
  for (let i = 0; i < rows.length; i += chunkSize) {
    const batch = rows.slice(i, i + chunkSize)
    const { error: insErr } = await supabase.from('vault_chunks').insert(batch)
    if (insErr) return { stored: false, error: insErr.message, chunkCount: 0 }
  }

  return { stored: true, error: null, chunkCount: chunks.length }
}

function chunkIdFromDb(sourcePath: string, chunkIndex: number): string {
  return createHash('sha1')
    .update(`${sourcePath}#${chunkIndex}`)
    .digest('hex')
    .slice(0, 12)
}

export async function loadVaultChunksFromCloud(
  supabase: SupabaseClient,
  vaultId: string,
  clerkUserId: string,
): Promise<{ chunks: VaultContentChunk[]; indexedAt: string | null; error: string | null }> {
  const exists = await vaultChunksTableExists(supabase)
  if (!exists) {
    return { chunks: [], indexedAt: null, error: null }
  }

  const owned = await verifyVaultOwnedByClerk(supabase, vaultId, clerkUserId)
  if (!owned) {
    return { chunks: [], indexedAt: null, error: 'Vault not found for user' }
  }

  const { data, error } = await supabase
    .from('vault_chunks')
    .select('source_path, chunk_index, content, indexed_at')
    .eq('vault_id', vaultId)
    .eq('clerk_user_id', clerkUserId)
    .order('source_path', { ascending: true })
    .order('chunk_index', { ascending: true })

  if (error) return { chunks: [], indexedAt: null, error: error.message }

  const rows = (data ?? []) as Pick<VaultChunkDbRow, 'source_path' | 'chunk_index' | 'content' | 'indexed_at'>[]
  const chunks: VaultContentChunk[] = rows.map((r) => ({
    id: chunkIdFromDb(r.source_path, r.chunk_index),
    relativePath: r.source_path,
    chunkIndex: r.chunk_index,
    text: r.content,
  }))

  const indexedAt =
    rows.length > 0
      ? rows.reduce((latest, r) => {
          const t = r.indexed_at ?? ''
          return t > latest ? t : latest
        }, '')
      : null

  return { chunks, indexedAt, error: null }
}
