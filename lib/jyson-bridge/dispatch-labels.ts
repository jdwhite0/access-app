/** Human labels for P10 command layer (intent + destination display). */

const INTENT_LABELS: Record<string, string> = {
  update_experience: 'Update Website',
  create_experience: 'Create Experience',
  create_product: 'Create Product',
  update_product: 'Update Product',
  create_content: 'Generate Content',
  create_vault_note: 'Create Vault Note',
  update_organization: 'Build Organization',
  update_blueprint: 'Update Blueprint',
  read_system: 'Read System',
  materialize_system: 'Materialize System',
  export_system: 'Export System',
  unknown: 'Unclassified Intent',
}

const DESTINATION_LABELS: Record<string, string> = {
  ACCESS: 'ACCESS',
  VAULT: 'Vault',
  LOCAL_FILES: 'Local Files',
  OBSIDIAN: 'Obsidian',
  JYSON_INTERNAL: 'JYSON Internal',
  FUTURE_CLAUDE: 'Claude (future)',
  FUTURE_CURSOR: 'Cursor (future)',
  FUTURE_EXTERNAL_API: 'External API (future)',
}

export function labelForIntent(intent: string): string {
  return INTENT_LABELS[intent] ?? intent.replace(/_/g, ' ')
}

export function labelForDestination(destination: string): string {
  return DESTINATION_LABELS[destination] ?? destination
}

/** Example commands shown under the input (not chat). */
export const COMMAND_EXAMPLES = [
  'Create Product',
  'Create Experience',
  'Generate Content',
  'Update Website',
  'Create Vault Note',
  'Build Organization',
] as const

/** Map UI labels to phrases P7 classifiers already understand (no P7 changes). */
export const COMMAND_EXAMPLE_PHRASES: Record<(typeof COMMAND_EXAMPLES)[number], string> = {
  'Create Product': 'I need a new product',
  'Create Experience': 'add experience',
  'Generate Content': 'generate content',
  'Update Website': 'update my website',
  'Create Vault Note': 'create a vault note',
  'Build Organization': 'update organization',
}

export function normalizeCommandForDispatch(text: string): string {
  const trimmed = text.trim()
  const alias = COMMAND_EXAMPLE_PHRASES[trimmed as (typeof COMMAND_EXAMPLES)[number]]
  if (alias) return alias
  return trimmed
}
