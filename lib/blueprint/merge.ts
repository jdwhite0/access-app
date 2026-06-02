import type { FounderBlueprintSpec } from '@/types/founder-blueprint'

/** Shallow merge for top-level keys; replaces array fields when provided. */
export function mergeFounderBlueprint(
  base: FounderBlueprintSpec,
  patch: Partial<FounderBlueprintSpec>
): FounderBlueprintSpec {
  return {
    ...base,
    ...patch,
    founder: patch.founder ? { ...base.founder, ...patch.founder } : base.founder,
    output: patch.output ? { ...base.output, ...patch.output } : base.output,
    meta: patch.meta ? { ...base.meta, ...patch.meta } : base.meta,
    organizations: patch.organizations ?? base.organizations,
    products: patch.products ?? base.products,
    experiences: patch.experiences ?? base.experiences,
  }
}
