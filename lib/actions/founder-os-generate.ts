'use server'

import { auth } from '@clerk/nextjs/server'
import { getOrCreateFounderBlueprint } from '@/lib/actions/founder-blueprint'
import { validateFounderBlueprint } from '@/lib/blueprint/validate-mvp'
import {
  generateFounderOsPackageFromSpec,
  type GenerateStage,
} from '@/lib/founder-os/generate-package'
import { STAGE_LABELS } from '@/lib/founder-os/stage-labels'
import { createSupabaseAdmin } from '@/lib/supabase'
import { FOUNDER_OS_BLUEPRINT_TYPE } from '@/types/founder-blueprint'

export type FounderOsGenerateResult = {
  success: boolean
  message: string
  founderOsId?: string
  outDir?: string
  stages: GenerateStage[]
  filesWritten?: number
}

export async function generateFounderOsFromBlueprint(): Promise<FounderOsGenerateResult> {
  const stages: GenerateStage[] = ['validating']

  const current = await getOrCreateFounderBlueprint()
  if (!current) {
    return {
      success: false,
      message: 'No Founder Blueprint found. Complete the wizard first.',
      stages,
    }
  }

  const validation = await validateFounderBlueprint(current.spec)
  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors.join('; ') || 'Blueprint validation failed.',
      stages,
    }
  }

  stages.push('generating_yaml')
  const now = new Date().toISOString()
  const spec = {
    ...current.spec,
    status: 'materialized' as const,
    exported_at: current.spec.exported_at ?? now,
  }

  const generated = await generateFounderOsPackageFromSpec(spec)
  stages.push(...generated.stages.filter((s) => !stages.includes(s)))

  if (!generated.success) {
    return {
      success: false,
      message: generated.error ?? 'Founder OS generation failed.',
      stages,
    }
  }

  // Persist materialized status so the companion can load from Supabase on cloud/ephemeral hosts
  try {
    const { userId } = await auth()
    const supabase = createSupabaseAdmin()
    if (supabase && userId) {
      await supabase
        .from('blueprints')
        .update({ answers: spec })
        .eq('clerk_user_id', userId)
        .eq('type', FOUNDER_OS_BLUEPRINT_TYPE)
    }
  } catch {
    // Non-fatal — package is on disk; companion loads from filesystem first
  }

  return {
    success: true,
    message: STAGE_LABELS.complete,
    founderOsId: generated.founderOsId,
    outDir: generated.outDir,
    stages,
    filesWritten: generated.filesWritten?.length,
  }
}
