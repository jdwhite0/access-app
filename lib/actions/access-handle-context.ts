'use server'

import { auth } from '@clerk/nextjs/server'
import { buildAccessHandleContext } from '@/lib/access-handle/build-handle-context'
import { resolveAccessHandle } from '@/lib/access-handle/resolve-handle'
import { createSupabaseAdmin } from '@/lib/supabase'
import { rowToFounderBlueprint } from '@/lib/blueprint/from-row'
import { FOUNDER_OS_BLUEPRINT_TYPE } from '@/types/founder-blueprint'
import type { AccessHandleContext } from '@/lib/access-handle/types'
import type { FounderBlueprintResult } from '@/lib/actions/founder-blueprint'
import { getFounderBlueprint } from '@/lib/actions/founder-blueprint'

export async function resolveAccessHandleAction(
  handleInput: string
): Promise<{ valid: boolean; handle: string; error?: string }> {
  return resolveAccessHandle(handleInput)
}

export async function loadBlueprintByHandle(handleInput: string): Promise<{
  result: FounderBlueprintResult | null
  error?: string
}> {
  const resolved = resolveAccessHandle(handleInput)
  if (!resolved.valid) {
    return { result: null, error: resolved.error }
  }

  const supabase = createSupabaseAdmin()
  if (supabase) {
    const { data } = await supabase
      .from('blueprints')
      .select('*')
      .eq('owner_handle', resolved.handle)
      .eq('type', FOUNDER_OS_BLUEPRINT_TYPE)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (data) {
      const row = rowToFounderBlueprint(data)
      if (row) return { result: { row, spec: row.answers } }
    }
  }

  const { context, error } = await buildAccessHandleContext(resolved.handle)
  if (!context) return { result: null, error }

  return {
    result: {
      row: {
        id: context.blueprint.access_blueprint_id ?? 'handle-local',
        clerk_user_id: 'handle-lookup',
        owner_handle: resolved.handle,
        type: FOUNDER_OS_BLUEPRINT_TYPE,
        answers: context.blueprint,
        system_id: null,
        created_at: new Date().toISOString(),
      },
      spec: context.blueprint,
    },
  }
}

export async function loadAccessHandleContext(
  handleInput: string
): Promise<{ context: AccessHandleContext | null; error?: string }> {
  return buildAccessHandleContext(handleInput)
}

/** Session user’s handle context (Clerk + canonical blueprint). */
export async function loadAccessHandleContextForSession(): Promise<{
  context: AccessHandleContext | null
  error?: string
}> {
  const { userId } = await auth()
  if (!userId) {
    return { context: null, error: 'Not authenticated.' }
  }

  const bp = await getFounderBlueprint()
  if (bp?.spec?.founder?.access_handle) {
    return buildAccessHandleContext(bp.spec.founder.access_handle)
  }

  return { context: null, error: 'No blueprint for current session.' }
}

export async function exportAccessHandleContextJson(
  handleInput: string
): Promise<{ json: string | null; error?: string }> {
  const { context, error } = await buildAccessHandleContext(handleInput)
  if (!context) return { json: null, error }
  return { json: JSON.stringify(context, null, 2) }
}
