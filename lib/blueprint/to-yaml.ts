import { stringify } from 'yaml'
import type { FounderBlueprintSpec } from '@/types/founder-blueprint'

export function founderBlueprintToYaml(spec: FounderBlueprintSpec): string {
  return stringify(spec, {
    lineWidth: 0,
    defaultStringType: 'QUOTE_DOUBLE',
  })
}
