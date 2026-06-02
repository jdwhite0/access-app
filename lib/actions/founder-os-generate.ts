'use server'

import { getOrCreateFounderBlueprint } from '@/lib/actions/founder-blueprint'
import { validateFounderBlueprint } from '@/lib/blueprint/validate-mvp'
import {
  generateFounderOsPackageFromSpec,
  type GenerateStage,
} from '@/lib/founder-os/generate-package'
import { STAGE_LABELS } from '@/lib/founder-os/stage-labels'

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
  const spec = {
    ...current.spec,
    status: 'exported' as const,
    exported_at: current.spec.exported_at ?? new Date().toISOString(),
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

  return {
    success: true,
    message: STAGE_LABELS.complete,
    founderOsId: generated.founderOsId,
    outDir: generated.outDir,
    stages,
    filesWritten: generated.filesWritten?.length,
  }
}
