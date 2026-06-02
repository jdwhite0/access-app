import type { GenerateStage } from './generate-package'

export const STAGE_LABELS: Record<GenerateStage, string> = {
  validating: 'Validating blueprint…',
  generating_yaml: 'Generating YAML snapshot…',
  generating_registry: 'Generating Registry…',
  generating_vault_seeds: 'Generating Vault Seeds…',
  complete: 'Founder OS Ready',
}

export function stageLabel(stage: GenerateStage): string {
  return STAGE_LABELS[stage]
}
