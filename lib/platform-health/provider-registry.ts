import type { PlatformProviderId } from './status-types'

export type ProviderDefinition = {
  id: PlatformProviderId
  displayName: string
  category: 'ai' | 'data' | 'auth' | 'hosting' | 'local' | 'client' | 'unknown'
  statusPageUrl?: string
}

export const PROVIDER_REGISTRY: Record<PlatformProviderId, ProviderDefinition> = {
  anthropic_claude: {
    id: 'anthropic_claude',
    displayName: 'Anthropic Claude',
    category: 'ai',
    statusPageUrl: 'https://status.anthropic.com/',
  },
  openai: {
    id: 'openai',
    displayName: 'OpenAI',
    category: 'ai',
    statusPageUrl: 'https://status.openai.com/',
  },
  supabase: {
    id: 'supabase',
    displayName: 'Supabase',
    category: 'data',
    statusPageUrl: 'https://status.supabase.com/',
  },
  vercel: {
    id: 'vercel',
    displayName: 'Vercel',
    category: 'hosting',
    statusPageUrl: 'https://www.vercel-status.com/',
  },
  clerk: {
    id: 'clerk',
    displayName: 'Clerk',
    category: 'auth',
    statusPageUrl: 'https://status.clerk.com/',
  },
  local_connector: {
    id: 'local_connector',
    displayName: 'ACCESS Local Connector',
    category: 'local',
  },
  local_filesystem: {
    id: 'local_filesystem',
    displayName: 'Local Intelligence Vault',
    category: 'local',
  },
  local_runtime: {
    id: 'local_runtime',
    displayName: 'Local Dev Runtime',
    category: 'local',
  },
  browser_client: {
    id: 'browser_client',
    displayName: 'Browser Client',
    category: 'client',
  },
  unknown_provider: {
    id: 'unknown_provider',
    displayName: 'Unknown Provider',
    category: 'unknown',
  },
}

export function getProvider(id: PlatformProviderId): ProviderDefinition {
  return PROVIDER_REGISTRY[id]
}
