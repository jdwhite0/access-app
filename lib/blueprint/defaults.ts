import {
  FOUNDER_BLUEPRINT_SCHEMA_VERSION,
  type FounderBlueprintSpec,
} from '@/types/founder-blueprint'

export function handleToFounderOsId(accessHandle: string): string {
  const base = accessHandle.replace(/\.access$/i, '').replace(/[^a-z0-9-]/g, '-')
  return `${base}-founder-os`
}

export function handleToBlueprintId(accessHandle: string): string {
  const base = accessHandle.replace(/\.access$/i, '').replace(/[^a-z0-9-]/g, '-')
  return `${base}-founder-os`
}

export function createDefaultFounderBlueprint(input: {
  accessHandle: string
  displayName: string
  accessBlueprintId?: string
}): FounderBlueprintSpec {
  const blueprintId = handleToBlueprintId(input.accessHandle)
  const founderOsId = handleToFounderOsId(input.accessHandle)

  return {
    schema_version: FOUNDER_BLUEPRINT_SCHEMA_VERSION,
    blueprint_id: blueprintId,
    blueprint_version: 1,
    status: 'draft',
    ...(input.accessBlueprintId
      ? { access_blueprint_id: input.accessBlueprintId }
      : {}),
    meta: {
      origination: 'access_wizard',
      authority: 'canonical',
      draft: false,
    },
    founder: {
      display_name: input.displayName,
      access_handle: input.accessHandle,
    },
    organizations: [],
    products: [],
    experiences: [],
    output: {
      founder_os_id: founderOsId,
      name: `${input.displayName} Founder OS`,
    },
  }
}
