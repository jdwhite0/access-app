import type {
  ClassifiedIssueKind,
  IncidentCategory,
  PlatformProductId,
  PlatformProviderId,
  StatusAudience,
} from './status-types'

export type AudienceMessages = Record<StatusAudience, string>

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9_-]{10,}/g,
  /service_role[a-zA-Z0-9_-]*/gi,
  /SUPABASE_SERVICE_ROLE_KEY/gi,
  /CLERK_SECRET/gi,
  /Bearer\s+[a-zA-Z0-9._-]+/gi,
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
]

const ABSOLUTE_PATH_PATTERN =
  /(?:\/Users\/|\/home\/|C:\\|D:\\)[^\s'"]+/g

export function sanitizeForAudience(
  text: string,
  audience: StatusAudience
): string {
  if (audience === 'internal_engineering') return text

  let out = text
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, '[redacted]')
  }
  if (audience === 'consumer_public' || audience === 'enterprise_admin') {
    out = out.replace(ABSOLUTE_PATH_PATTERN, '[local path]')
    out = out.replace(/\.env\.local/gi, 'environment configuration')
  }
  return out.trim()
}

type MessageTemplate = {
  engineering: string
  operator: string
  consumer: string
  enterprise?: string
}

const TEMPLATES: Record<ClassifiedIssueKind, MessageTemplate> = {
  provider_degraded: {
    engineering:
      'Anthropic Claude API is degraded or overloaded. This is likely external provider instability, not an ACCESS schema failure. Pause provider-dependent tasks and retry after provider status recovers.',
    operator:
      'Claude is temporarily unstable. JD AI Systems should pause AI-dependent operations and continue local-only work.',
    consumer:
      'Some AI responses may be delayed. Core system access remains available.',
    enterprise:
      'AI inference capacity is temporarily reduced. Your data and authentication are unaffected.',
  },
  schema_blocked: {
    engineering:
      'Supabase schema is incomplete (missing table, function, or policy). Apply migrations in order per APPLY_ORDER.md, then run npm run platform:verify-m0.',
    operator:
      'Cloud database setup is incomplete. Platform sync and registry features are blocked until migrations finish.',
    consumer:
      'Some cloud features are temporarily unavailable while system maintenance completes.',
  },
  env_invalid: {
    engineering:
      'Supabase URL in environment is invalid. Use a full https://<project-ref>.supabase.co origin or a bare project ref resolved by resolveSupabaseUrl().',
    operator:
      'Cloud connection settings need correction before database operations can run.',
    consumer:
      'System configuration is being updated. Please try again shortly.',
  },
  env_missing: {
    engineering:
      'Required environment variable is missing. Check access-app/.env.local against .env.local.example.',
    operator:
      'A required configuration value is missing. Engineering must update deployment secrets.',
    consumer:
      'System configuration is incomplete. Please try again later.',
  },
  connector_pairing_expired: {
    engineering:
      'Connector pairing code is invalid or expired. Run npm run pairing:code -- <handle> and npm run connector:register -- <CODE>.',
    operator:
      'Device pairing expired. Generate a new pairing code and re-register the local connector.',
    consumer:
      'Device connection needs to be refreshed. Follow your setup guide to reconnect.',
  },
  local_dev_conflict: {
    engineering:
      'Local port is already in use (EADDRINUSE). Stop the conflicting process or change the dev server port.',
    operator:
      'Local development server cannot start because the port is busy.',
    consumer:
      'Service is temporarily unavailable in this environment.',
  },
  local_env_missing: {
    engineering:
      'ACCESS_VAULT_ROOT is missing or points to a path that does not exist. Export ACCESS_VAULT_ROOT to the JD AI Systems monorepo root before connector scan/compile.',
    operator:
      'Local vault path is not configured. Set ACCESS_VAULT_ROOT to the Intelligence Vault root.',
    consumer:
      'Local content library path is not available in this environment.',
  },
  sync_not_ready: {
    engineering:
      'Sync apply is not ready. Complete schema verification, dry-run (npm run m4:dry-run), and operator approval before npm run connector:sync-apply.',
    operator:
      'Registry sync is planned but not approved for apply yet.',
    consumer:
      'Updates are being prepared. No data has been lost.',
  },
  auth_or_policy_blocked: {
    engineering:
      'Auth or RLS policy blocked the operation. Verify Clerk session, SUPABASE_JWT_SECRET, tenant JWT path, and access_set_request_context grants.',
    operator:
      'Access permissions prevented this action. Sign in again or contact your administrator.',
    consumer:
      'You do not have access to perform this action right now.',
  },
  unknown_unclassified: {
    engineering:
      'Unclassified error. Capture logs, classify manually, and extend platform-health/error-classifier.ts.',
    operator:
      'An unexpected issue occurred. Engineering has been notified to investigate.',
    consumer:
      'Something went wrong. Please try again or contact support if this continues.',
  },
}

export function buildAudienceMessages(input: {
  kind: ClassifiedIssueKind
  product: PlatformProductId
  provider: PlatformProviderId
  category: IncidentCategory
  rawDetail?: string
}): AudienceMessages {
  const base = TEMPLATES[input.kind]
  const suffix =
    input.kind === 'unknown_unclassified' && input.rawDetail
      ? ` Detail: ${input.rawDetail.slice(0, 200)}`
      : ''

  return {
    internal_engineering: sanitizeForAudience(
      `${base.engineering}${suffix}`,
      'internal_engineering'
    ),
    operator: sanitizeForAudience(base.operator, 'operator'),
    consumer_public: sanitizeForAudience(base.consumer, 'consumer_public'),
    enterprise_admin: sanitizeForAudience(
      base.enterprise ?? base.operator,
      'enterprise_admin'
    ),
  }
}
