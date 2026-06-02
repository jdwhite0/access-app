import type { FounderBlueprintSpec, FounderOsBlueprintRow } from '@/types/founder-blueprint'
import { FOUNDER_OS_BLUEPRINT_TYPE } from '@/types/founder-blueprint'
import { parseFounderBlueprintAnswers } from '@/lib/blueprint/validate-mvp'

export function rowToFounderBlueprint(row: {
  id: string
  clerk_user_id: string
  owner_handle: string
  type: string
  answers: unknown
  system_id: string | null
  created_at: string
}): FounderOsBlueprintRow | null {
  if (row.type !== FOUNDER_OS_BLUEPRINT_TYPE) return null
  const spec = parseFounderBlueprintAnswers(row.answers)
  if (!spec) return null
  return {
    id: row.id,
    clerk_user_id: row.clerk_user_id,
    owner_handle: row.owner_handle,
    type: FOUNDER_OS_BLUEPRINT_TYPE,
    answers: spec,
    system_id: row.system_id,
    created_at: row.created_at,
  }
}
