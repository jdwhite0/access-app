import type { SupabaseClient } from '@supabase/supabase-js'

export type RollbackSnapshot = {
  table: string
  id: string
  previous: Record<string, unknown>
}

export async function applyRollback(
  supabase: SupabaseClient,
  snapshots: RollbackSnapshot[]
): Promise<{ ok: boolean; errors: string[] }> {
  const errors: string[] = []

  for (const snap of [...snapshots].reverse()) {
    const { error } = await supabase
      .from(snap.table)
      .update(snap.previous)
      .eq('id', snap.id)

    if (error) errors.push(`${snap.table}/${snap.id}: ${error.message}`)
  }

  return { ok: errors.length === 0, errors }
}
