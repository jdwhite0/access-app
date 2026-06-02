'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { getIdentity } from '@/lib/actions/identity'
import { createDefaultFounderBlueprint } from '@/lib/blueprint/defaults'
import { mergeFounderBlueprint } from '@/lib/blueprint/merge'
import { rowToFounderBlueprint } from '@/lib/blueprint/from-row'
import { validateFounderBlueprint } from '@/lib/blueprint/validate-mvp'
import { founderBlueprintToYaml } from '@/lib/blueprint/to-yaml'
import { FOUNDER_OS_BLUEPRINT_TYPE } from '@/types/founder-blueprint'
import type {
  FounderBlueprintExportResult,
  FounderBlueprintSpec,
  FounderBlueprintValidationResult,
  FounderOsBlueprintRow,
} from '@/types/founder-blueprint'

export type FounderBlueprintResult = {
  row: FounderOsBlueprintRow
  spec: FounderBlueprintSpec
}

async function requireUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

function displayNameFromClerk(user: Awaited<ReturnType<typeof currentUser>>): string {
  if (!user) return 'Founder'
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return name || user.username || user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Founder'
}

export async function getOrCreateFounderBlueprint(): Promise<FounderBlueprintResult | null> {
  const userId = await requireUserId()
  if (!userId) return null

  const supabase = createSupabaseAdmin()
  const identity = await getIdentity()

  if (!supabase) {
    const handle = identity?.handle ?? 'guest.access'
    const user = await currentUser()
    const spec = createDefaultFounderBlueprint({
      accessHandle: handle,
      displayName: displayNameFromClerk(user),
    })
    return {
      row: {
        id: 'local-founder-os',
        clerk_user_id: userId,
        owner_handle: handle,
        type: FOUNDER_OS_BLUEPRINT_TYPE,
        answers: spec,
        system_id: null,
        created_at: new Date().toISOString(),
      },
      spec,
    }
  }

  const { data: existing } = await supabase
    .from('blueprints')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('type', FOUNDER_OS_BLUEPRINT_TYPE)
    .maybeSingle()

  if (existing) {
    const row = rowToFounderBlueprint(existing)
    if (row) return { row, spec: row.answers }
  }

  const handle = identity?.handle
  if (!handle) return null

  const user = await currentUser()
  const spec = createDefaultFounderBlueprint({
    accessHandle: handle,
    displayName: displayNameFromClerk(user),
  })

  const { data: inserted, error } = await supabase
    .from('blueprints')
    .insert({
      clerk_user_id: userId,
      owner_handle: handle,
      type: FOUNDER_OS_BLUEPRINT_TYPE,
      answers: spec,
      system_id: null,
    })
    .select('*')
    .single()

  if (error || !inserted) return null
  const row = rowToFounderBlueprint(inserted)
  if (!row) return null
  return { row, spec: row.answers }
}

export async function getFounderBlueprint(): Promise<FounderBlueprintResult | null> {
  const userId = await requireUserId()
  if (!userId) return null

  const supabase = createSupabaseAdmin()
  if (!supabase) return getOrCreateFounderBlueprint()

  const { data } = await supabase
    .from('blueprints')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('type', FOUNDER_OS_BLUEPRINT_TYPE)
    .maybeSingle()

  if (!data) return null
  const row = rowToFounderBlueprint(data)
  if (!row) return null
  return { row, spec: row.answers }
}

export async function updateFounderBlueprint(
  patch: Partial<FounderBlueprintSpec>
): Promise<{ result: FounderBlueprintResult | null; validation: FounderBlueprintValidationResult }> {
  const current = await getOrCreateFounderBlueprint()
  if (!current) {
    return {
      result: null,
      validation: { valid: false, errors: ['No founder blueprint; claim ACCESS identity first.'] },
    }
  }

  const merged = mergeFounderBlueprint(current.spec, patch)
  merged.access_blueprint_id = current.row.id
  const validation = await validateFounderBlueprint(merged)
  if (!validation.valid) {
    return { result: null, validation }
  }

  const userId = await requireUserId()
  if (!userId) {
    return { result: null, validation: { valid: false, errors: ['Not authenticated.'] } }
  }

  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return {
      result: {
        row: { ...current.row, answers: merged },
        spec: merged,
      },
      validation,
    }
  }

  const { data: updated, error } = await supabase
    .from('blueprints')
    .update({ answers: merged })
    .eq('id', current.row.id)
    .eq('clerk_user_id', userId)
    .eq('type', FOUNDER_OS_BLUEPRINT_TYPE)
    .select('*')
    .single()

  if (error || !updated) {
    return {
      result: null,
      validation: { valid: false, errors: [error?.message ?? 'Update failed.'] },
    }
  }

  const row = rowToFounderBlueprint(updated)
  if (!row) {
    return {
      result: null,
      validation: { valid: false, errors: ['Stored blueprint has invalid shape.'] },
    }
  }

  return { result: { row, spec: row.answers }, validation }
}

export async function exportFounderBlueprintYaml(): Promise<{
  exportResult: FounderBlueprintExportResult | null
  validation: FounderBlueprintValidationResult
}> {
  const current = await getOrCreateFounderBlueprint()
  if (!current) {
    return {
      exportResult: null,
      validation: { valid: false, errors: ['No founder blueprint available.'] },
    }
  }

  const spec: FounderBlueprintSpec = {
    ...current.spec,
    status: 'exported',
    exported_at: new Date().toISOString(),
    access_blueprint_id: current.row.id,
    meta: {
      origination: current.spec.meta?.origination ?? 'access_wizard',
      authority: 'canonical',
      draft: false,
    },
  }

  const validation = await validateFounderBlueprint(spec)
  if (!validation.valid) {
    return { exportResult: null, validation }
  }

  const userId = await requireUserId()
  const supabase = createSupabaseAdmin()

  if (supabase && userId) {
    const { data: updated, error } = await supabase
      .from('blueprints')
      .update({ answers: spec })
      .eq('id', current.row.id)
      .eq('clerk_user_id', userId)
      .eq('type', FOUNDER_OS_BLUEPRINT_TYPE)
      .select('*')
      .single()

    if (error || !updated) {
      return {
        exportResult: null,
        validation: { valid: false, errors: [error?.message ?? 'Export persist failed.'] },
      }
    }

    const row = rowToFounderBlueprint(updated)
    if (!row) {
      return {
        exportResult: null,
        validation: { valid: false, errors: ['Invalid row after export.'] },
      }
    }

    const yaml = founderBlueprintToYaml(spec)
    return {
      exportResult: { yaml, spec, row },
      validation,
    }
  }

  const yaml = founderBlueprintToYaml(spec)
  return {
    exportResult: {
      yaml,
      spec,
      row: { ...current.row, answers: spec },
    },
    validation,
  }
}

/** Validate an in-memory spec (no persistence). */
export async function validateFounderBlueprintSpec(
  spec: FounderBlueprintSpec
): Promise<FounderBlueprintValidationResult> {
  return validateFounderBlueprint(spec)
}
