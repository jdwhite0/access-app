/**
 * JD AI Systems — Recommendation Definitions Registry.
 *
 * Canonical operational definitions for every ClassifiedIssueKind.
 * Each definition provides structured resolution guidance: title,
 * description, action label, and an ordered checklist of resolution steps.
 *
 * This is the single source of truth for recommendation content.
 * The recommendations engine (recommendations.ts) detects kinds;
 * the build-bundle enriches them with definitions from this registry.
 */
import type { ClassifiedIssueKind, PlatformProviderId, PlatformProductId } from '@/lib/platform-health'
import type { RecommendationPriority } from '@/lib/command-center/recommendations'

export type ResolutionStep = {
  index: number
  label: string
  /** Optional CLI command the operator can run for this step. */
  command?: string
}

export type RecommendationDefinition = {
  kind: ClassifiedIssueKind
  priority: RecommendationPriority
  title: string
  description: string
  /** Short imperative label for the next action — displayed as a call-to-action. */
  actionLabel: string
  resolutionSteps: ResolutionStep[]
  /** Providers typically implicated by this kind (for display enrichment). */
  defaultAffectedProviders: PlatformProviderId[]
  /** Products typically impacted by this kind (for display enrichment). */
  defaultAffectedProducts: PlatformProductId[]
}

// ─── Definitions registry ─────────────────────────────────────────────────────

export const RECOMMENDATION_DEFINITIONS: Record<ClassifiedIssueKind, RecommendationDefinition> = {

  env_missing: {
    kind: 'env_missing',
    priority: 'high',
    title: 'Missing Environment Variable',
    description:
      'A required environment variable is absent from the server configuration. ' +
      'The platform cannot initialize the affected service until the variable is present and the server restarts.',
    actionLabel: 'Add missing variable to .env.local',
    resolutionSteps: [
      { index: 1, label: 'Open access-app/.env.local in your editor' },
      { index: 2, label: 'Compare against .env.local.example to identify missing keys', command: 'diff .env.local .env.local.example' },
      { index: 3, label: 'Add each missing key with the correct value' },
      { index: 4, label: 'Save the file and restart the dev server', command: 'npm run dev' },
      { index: 5, label: 'Verify the platform health check passes', command: 'npm run platform-health:verify' },
    ],
    defaultAffectedProviders: ['supabase', 'clerk', 'local_connector'],
    defaultAffectedProducts: ['access_os'],
  },

  env_invalid: {
    kind: 'env_invalid',
    priority: 'high',
    title: 'Invalid Environment Variable',
    description:
      'An environment variable is present but its value is malformed. ' +
      'Common causes: Supabase URL missing the https:// prefix, or a key copied with extra whitespace.',
    actionLabel: 'Correct the malformed variable value',
    resolutionSteps: [
      { index: 1, label: 'Open access-app/.env.local and locate the flagged variable' },
      { index: 2, label: 'Verify the Supabase URL starts with https:// and ends with .supabase.co' },
      { index: 3, label: 'Remove any leading or trailing whitespace from the value' },
      { index: 4, label: 'Cross-reference the Supabase project dashboard for the correct URL' },
      { index: 5, label: 'Restart the dev server and re-verify', command: 'npm run dev && npm run platform-health:verify' },
    ],
    defaultAffectedProviders: ['supabase'],
    defaultAffectedProducts: ['access_os'],
  },

  connector_pairing_expired: {
    kind: 'connector_pairing_expired',
    priority: 'high',
    title: 'Connector Pairing Code Expired',
    description:
      'The connector pairing code has expired or was already consumed. ' +
      'A new code must be generated and the local connector re-registered before sync operations can proceed.',
    actionLabel: 'Generate a new pairing code',
    resolutionSteps: [
      { index: 1, label: 'Generate a new pairing code from the ACCESS app operator panel' },
      { index: 2, label: 'Or generate via CLI:', command: 'npm run pairing:code -- <handle>' },
      { index: 3, label: 'Copy the 6-character code from the output' },
      { index: 4, label: 'Register the connector with the new code:', command: 'cd packages/access-connector && npm run register -- <CODE>' },
      { index: 5, label: 'Verify the connector heartbeat is active', command: 'npm run connector:heartbeat' },
    ],
    defaultAffectedProviders: ['local_connector'],
    defaultAffectedProducts: ['access_os'],
  },

  auth_or_policy_blocked: {
    kind: 'auth_or_policy_blocked',
    priority: 'critical',
    title: 'Authentication or Policy Blocked',
    description:
      'An operation was blocked by an auth layer or Row Level Security policy. ' +
      'This typically means a JWT secret is not configured, the tenant context is not being set, or a Clerk session has expired.',
    actionLabel: 'Review Clerk and Supabase auth configuration',
    resolutionSteps: [
      { index: 1, label: 'Verify CLERK_SECRET_KEY is set in access-app/.env.local' },
      { index: 2, label: 'Verify SUPABASE_JWT_SECRET matches the value in your Supabase project JWT settings' },
      { index: 3, label: 'Confirm the access_set_request_context function is applied in Supabase SQL Editor', command: 'npm run platform:verify-m0' },
      { index: 4, label: 'Check that NEXT_PUBLIC_SUPABASE_ANON_KEY is set for tenant client operations' },
      { index: 5, label: 'If the issue is a Clerk session, sign out and sign back in via the ACCESS app' },
      { index: 6, label: 'Re-run the full platform verification', command: 'npm run platform-health:verify' },
    ],
    defaultAffectedProviders: ['clerk', 'supabase'],
    defaultAffectedProducts: ['access_os'],
  },

  provider_degraded: {
    kind: 'provider_degraded',
    priority: 'medium',
    title: 'External AI Provider Degraded',
    description:
      'An external AI provider (Claude, OpenAI) is reporting degraded capacity or returning overloaded errors. ' +
      'This is external provider instability — not a platform schema or configuration failure. ' +
      'AI-dependent features will be impacted until the provider recovers.',
    actionLabel: 'Pause AI-dependent operations and monitor status',
    resolutionSteps: [
      { index: 1, label: 'Check the Anthropic status page for active incidents', command: 'open https://status.anthropic.com' },
      { index: 2, label: 'Pause any AI-dependent batch jobs or automated workflows' },
      { index: 3, label: 'Switch to local-only operations (vault scan, compile, registry) while waiting' },
      { index: 4, label: 'Monitor the provider status page for recovery confirmation' },
      { index: 5, label: 'Resume AI-dependent operations once status returns to Operational' },
    ],
    defaultAffectedProviders: ['anthropic_claude', 'openai'],
    defaultAffectedProducts: ['jyson', 'access_os'],
  },

  schema_blocked: {
    kind: 'schema_blocked',
    priority: 'critical',
    title: 'Database Schema Migration Required',
    description:
      'One or more required Supabase tables, functions, or policies are missing. ' +
      'The platform cannot perform sync, registry, or connector operations until the migration is applied. ' +
      'Apply migrations in order — do not skip steps.',
    actionLabel: 'Apply pending Supabase migration',
    resolutionSteps: [
      { index: 1, label: 'Open your Supabase project → SQL Editor' },
      { index: 2, label: 'Apply migrations in this order: schema.sql → schema_v2.sql → schema_v3_vault.sql → schema_v4_platform_hardening.sql' },
      { index: 3, label: 'Verify the schema with the platform check', command: 'npm run platform:verify-m0' },
      { index: 4, label: 'If verify-m0 shows MISSING items, re-apply the corresponding SQL file' },
      { index: 5, label: 'Run full M4 validation once all tables are green', command: 'npm run e2e:m4' },
    ],
    defaultAffectedProviders: ['supabase'],
    defaultAffectedProducts: ['access_os', 'vault'],
  },

  local_env_missing: {
    kind: 'local_env_missing',
    priority: 'high',
    title: 'Intelligence Vault Root Not Found',
    description:
      'ACCESS_VAULT_ROOT is not set or points to a path that does not exist. ' +
      'The connector cannot scan, compile, or sync vault metadata without a valid root path.',
    actionLabel: 'Set ACCESS_VAULT_ROOT in your environment',
    resolutionSteps: [
      { index: 1, label: 'Locate the JD_Ai_System monorepo root on your machine (e.g. ~/Documents/JD_Ai_System)' },
      { index: 2, label: 'Export the variable in your shell profile:', command: 'echo \'export ACCESS_VAULT_ROOT=~/Documents/JD_Ai_System\' >> ~/.zshrc' },
      { index: 3, label: 'Reload your shell profile:', command: 'source ~/.zshrc' },
      { index: 4, label: 'Or set it for the current session only:', command: 'export ACCESS_VAULT_ROOT=~/Documents/JD_Ai_System' },
      { index: 5, label: 'Verify the path resolves correctly', command: 'ls $ACCESS_VAULT_ROOT' },
    ],
    defaultAffectedProviders: ['local_filesystem'],
    defaultAffectedProducts: ['vault', 'access_os'],
  },

  local_dev_conflict: {
    kind: 'local_dev_conflict',
    priority: 'medium',
    title: 'Local Port Already In Use',
    description:
      'The dev server port is occupied by another process (EADDRINUSE). ' +
      'The server cannot start until the conflict is resolved by stopping the other process or changing the port.',
    actionLabel: 'Stop the conflicting process',
    resolutionSteps: [
      { index: 1, label: 'Find which process is using the port (e.g. 3000):', command: 'lsof -ti:3000' },
      { index: 2, label: 'Stop the conflicting process:', command: 'kill -9 $(lsof -ti:3000)' },
      { index: 3, label: 'Or start the server on a different port:', command: 'PORT=3001 npm run dev' },
      { index: 4, label: 'Verify the server starts successfully', command: 'curl http://localhost:3000' },
    ],
    defaultAffectedProviders: ['local_runtime'],
    defaultAffectedProducts: ['access_os'],
  },

  sync_not_ready: {
    kind: 'sync_not_ready',
    priority: 'high',
    title: 'Sync Apply Not Ready',
    description:
      'Sync apply has not been approved to execute. ' +
      'Schema verification, a dry-run, and explicit operator approval are required before vault metadata can be applied to the cloud registry.',
    actionLabel: 'Complete sync prerequisites',
    resolutionSteps: [
      { index: 1, label: 'Verify the Supabase schema is complete', command: 'npm run platform:verify-m0' },
      { index: 2, label: 'Review the current sync plan:', command: 'cd packages/access-connector && npm run sync:plan' },
      { index: 3, label: 'Run the dry-run to validate without writing:', command: 'npm run m4:dry-run' },
      { index: 4, label: 'Review the dry-run output for conflicts or unexpected changes' },
      { index: 5, label: 'Execute sync apply once plan is verified and approved:', command: 'npm run connector:sync-apply' },
    ],
    defaultAffectedProviders: ['local_connector', 'supabase'],
    defaultAffectedProducts: ['access_os', 'vault'],
  },

  unknown_unclassified: {
    kind: 'unknown_unclassified',
    priority: 'low',
    title: 'Unclassified Error Detected',
    description:
      'An error was received that does not match any known platform pattern. ' +
      'This is typically a novel failure mode that should be diagnosed, documented, and added to the classifier.',
    actionLabel: 'Investigate and extend the error classifier',
    resolutionSteps: [
      { index: 1, label: 'Capture the full server logs for the failing request' },
      { index: 2, label: 'Identify the error source: provider, database, local env, or application code' },
      { index: 3, label: 'Open lib/platform-health/error-classifier.ts' },
      { index: 4, label: 'Add a new matchRules() case for the error pattern' },
      { index: 5, label: 'Add a corresponding test case to scripts/verify-platform-health.ts' },
      { index: 6, label: 'Run verification to confirm the new case is correctly classified', command: 'npm run platform-health:verify' },
    ],
    defaultAffectedProviders: ['unknown_provider'],
    defaultAffectedProducts: ['jd_ai_systems_core'],
  },

}

// ─── Resolver ─────────────────────────────────────────────────────────────────

export function getDefinition(kind: ClassifiedIssueKind): RecommendationDefinition {
  return RECOMMENDATION_DEFINITIONS[kind]
}

export function listDefinitions(): RecommendationDefinition[] {
  return Object.values(RECOMMENDATION_DEFINITIONS)
}
