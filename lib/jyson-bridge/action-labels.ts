/** Human-readable labels for companion panel (read-only display). */

const LABELS: Record<string, string> = {
  read_blueprint: 'Read your blueprint',
  read_registry: 'Read your system registry',
  read_vault_seeds: 'Read vault knowledge seeds',
  summarize_system: 'Summarize your digital world',
  list_organizations: 'View organizations',
  list_products: 'View products',
  create_product: 'Create products',
  list_experiences: 'View experiences',
  create_experience: 'Create experiences',
  create_content: 'Create content',
  update_organization: 'Update organizations',
  update_blueprint_draft: 'Update your blueprint',
  export_blueprint_yaml: 'Export blueprint',
  materialize_user_system: 'Generate your system package',
  route_to_jyson: 'Connect with JYSON',
  route_to_claude_code: 'Route to Claude (future)',
  route_to_cursor: 'Route to Cursor (future)',
  mutate_schema: 'Mutate protected schema',
  delete_identity: 'Delete identity',
  bypass_access_canonical_store: 'Bypass ownership',
  invoke_llm: 'Invoke AI models',
}

export function labelForAction(action: string): string {
  return LABELS[action] ?? action.replace(/_/g, ' ')
}

/** Curated display order for companion panel. */
export const COMPANION_ALLOWED_DISPLAY: string[] = [
  'update_blueprint_draft',
  'list_products',
  'create_product',
  'list_experiences',
  'create_experience',
  'summarize_system',
  'create_content',
  'update_organization',
  'read_blueprint',
  'materialize_user_system',
  'export_blueprint_yaml',
]

export const COMPANION_DENIED_DISPLAY: string[] = [
  'delete_identity',
  'bypass_access_canonical_store',
  'mutate_schema',
  'invoke_llm',
]
