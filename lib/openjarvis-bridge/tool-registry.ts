/**
 * OpenJarvis Tool Registry (ACCESS copy — keep in sync with jyson/backend/openjarvis-bridge)
 */

export type ToolId =
  | 'read_file'
  | 'write_file'
  | 'list_files'
  | 'read_vault_note'
  | 'write_vault_note'
  | 'read_email'
  | 'compose_email'
  | 'read_calendar'
  | 'create_event'
  | 'list_tasks'
  | 'create_task'
  | 'run_local_model'
  | 'browser_open'

export type ToolCategory = 'files' | 'vault' | 'email' | 'calendar' | 'tasks' | 'models' | 'browser'

export interface ToolDefinition {
  id: ToolId
  category: ToolCategory
  label: string
  description: string
  requiredAction: string
  requiresConfirmation: boolean
  mutates: boolean
  params: Record<string, { type: string; description: string; required: boolean }>
}

export const TOOL_REGISTRY: ToolDefinition[] = [
  {
    id: 'read_file',
    category: 'files',
    label: 'Read file',
    description: 'Read a file from the local Founder OS folder',
    requiredAction: 'read_vault_seeds',
    requiresConfirmation: false,
    mutates: false,
    params: {
      path: { type: 'string', description: 'File path relative to Founder OS root', required: true },
    },
  },
  {
    id: 'write_file',
    category: 'files',
    label: 'Write file',
    description: 'Write or update a file in the local Founder OS folder',
    requiredAction: 'update_blueprint_draft',
    requiresConfirmation: true,
    mutates: true,
    params: {
      path: { type: 'string', description: 'File path relative to Founder OS root', required: true },
      content: { type: 'string', description: 'File content to write', required: true },
    },
  },
  {
    id: 'list_files',
    category: 'files',
    label: 'List files',
    description: 'List files in a Founder OS folder',
    requiredAction: 'read_vault_seeds',
    requiresConfirmation: false,
    mutates: false,
    params: {
      directory: { type: 'string', description: 'Directory to list', required: false },
    },
  },
  {
    id: 'read_vault_note',
    category: 'vault',
    label: 'Read vault note',
    description: 'Read a note from the connected Obsidian vault',
    requiredAction: 'read_vault_seeds',
    requiresConfirmation: false,
    mutates: false,
    params: {
      notePath: { type: 'string', description: 'Vault-relative note path', required: true },
    },
  },
  {
    id: 'write_vault_note',
    category: 'vault',
    label: 'Write vault note',
    description: 'Create or update a note in the connected Obsidian vault',
    requiredAction: 'update_blueprint_draft',
    requiresConfirmation: true,
    mutates: true,
    params: {
      notePath: { type: 'string', description: 'Vault-relative note path', required: true },
      content: { type: 'string', description: 'Note content in markdown', required: true },
    },
  },
  {
    id: 'read_email',
    category: 'email',
    label: 'Read emails',
    description: 'Read recent emails matching a query',
    requiredAction: 'summarize_system',
    requiresConfirmation: false,
    mutates: false,
    params: {
      query: { type: 'string', description: 'Search query', required: false },
      limit: { type: 'number', description: 'Max emails to return', required: false },
    },
  },
  {
    id: 'compose_email',
    category: 'email',
    label: 'Compose email',
    description: 'Draft and send an email (requires explicit user approval)',
    requiredAction: 'summarize_system',
    requiresConfirmation: true,
    mutates: true,
    params: {
      to: { type: 'string', description: 'Recipient email address', required: true },
      subject: { type: 'string', description: 'Email subject', required: true },
      body: { type: 'string', description: 'Email body', required: true },
    },
  },
  {
    id: 'read_calendar',
    category: 'calendar',
    label: 'Read calendar',
    description: 'Read upcoming calendar events',
    requiredAction: 'summarize_system',
    requiresConfirmation: false,
    mutates: false,
    params: {
      days: { type: 'number', description: 'Days ahead to look', required: false },
    },
  },
  {
    id: 'create_event',
    category: 'calendar',
    label: 'Create calendar event',
    description: 'Create a new calendar event (requires user approval)',
    requiredAction: 'summarize_system',
    requiresConfirmation: true,
    mutates: true,
    params: {
      title: { type: 'string', description: 'Event title', required: true },
      start: { type: 'string', description: 'ISO start time', required: true },
      end: { type: 'string', description: 'ISO end time', required: true },
      description: { type: 'string', description: 'Event description', required: false },
    },
  },
  {
    id: 'run_local_model',
    category: 'models',
    label: 'Run local model',
    description: 'Run inference on a local Ollama model',
    requiredAction: 'summarize_system',
    requiresConfirmation: false,
    mutates: false,
    params: {
      model: { type: 'string', description: 'Ollama model name (e.g. qwen2.5-coder:7b)', required: true },
      prompt: { type: 'string', description: 'Prompt to send to the model', required: true },
    },
  },
]

export function getToolById(id: ToolId): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((t) => t.id === id)
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return TOOL_REGISTRY.filter((t) => t.category === category)
}
