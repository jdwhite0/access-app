import type { SupabaseClient } from '@supabase/supabase-js'
import type { VaultLocalFileRecord } from '@/lib/vault/scan-local-path'

let vaultFilesTableKnown: boolean | null = null

export async function vaultFilesTableExists(supabase: SupabaseClient): Promise<boolean> {
  if (vaultFilesTableKnown !== null) return vaultFilesTableKnown

  const { error } = await supabase.from('vault_files').select('id').limit(0)
  const msg = error?.message ?? ''
  if (
    error &&
    (error.code === '42P01' ||
      error.code === 'PGRST205' ||
      msg.includes('does not exist') ||
      msg.includes('schema cache'))
  ) {
    vaultFilesTableKnown = false
    return false
  }

  vaultFilesTableKnown = !error
  return vaultFilesTableKnown
}

export async function replaceVaultFileMetadata(
  supabase: SupabaseClient,
  vaultId: string,
  clerkUserId: string,
  files: VaultLocalFileRecord[],
): Promise<{ stored: boolean; error: string | null }> {
  const exists = await vaultFilesTableExists(supabase)
  if (!exists) return { stored: false, error: null }

  const { error: delErr } = await supabase
    .from('vault_files')
    .delete()
    .eq('vault_id', vaultId)
    .eq('clerk_user_id', clerkUserId)

  if (delErr) return { stored: false, error: delErr.message }

  if (files.length === 0) return { stored: true, error: null }

  const rows = files.map((f) => ({
    vault_id: vaultId,
    clerk_user_id: clerkUserId,
    relative_path: f.relativePath,
    extension: f.extension,
    size_bytes: f.sizeBytes,
    modified_at: f.modifiedAt,
  }))

  const chunkSize = 500
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error: insErr } = await supabase.from('vault_files').insert(chunk)
    if (insErr) return { stored: false, error: insErr.message }
  }

  return { stored: true, error: null }
}
