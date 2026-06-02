/**
 * JD AI Systems — Command Center runtime audit.
 *
 * Checks current process configuration against known provider requirements
 * and emits classified HealthEvents for any failures. No external HTTP calls.
 * Used by both the platform-health API and the command-center API.
 */
import { classifyError } from '@/lib/platform-health'
import type { HealthEvent } from '@/lib/platform-health'
import { isSupabaseConfigured, resolveSupabaseUrl } from '@/lib/supabase'
import { isConnectorJwtConfigured } from '@/lib/connector-auth/jwt'

export function collectRuntimeEvents(): HealthEvent[] {
  const events: HealthEvent[] = []

  // ── Supabase ─────────────────────────────────────────────────────────────
  const supabaseUrl = resolveSupabaseUrl()
  if (!supabaseUrl) {
    const raw = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
    events.push(
      classifyError({
        error: raw
          ? 'Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.'
          : 'SUPABASE_URL not configured.',
        product: 'access_os',
        service: 'database',
      }).event
    )
  } else if (!isSupabaseConfigured()) {
    events.push(
      classifyError({
        message: 'SUPABASE_SERVICE_ROLE_KEY not configured.',
        product: 'access_os',
        service: 'database',
      }).event
    )
  }

  // ── Connector JWT ─────────────────────────────────────────────────────────
  if (!isConnectorJwtConfigured()) {
    events.push(
      classifyError({
        message: 'ACCESS_CONNECTOR_JWT_SECRET not configured on server.',
        product: 'access_os',
        service: 'configuration',
      }).event
    )
  }

  // ── Intelligence Vault root ───────────────────────────────────────────────
  if (!process.env.ACCESS_VAULT_ROOT?.trim()) {
    events.push(
      classifyError({
        message: 'ACCESS_VAULT_ROOT not found',
        product: 'vault',
        service: 'vault',
      }).event
    )
  }

  // ── Clerk auth layer ──────────────────────────────────────────────────────
  const clerkPublishable = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
  const clerkSecret = process.env.CLERK_SECRET_KEY?.trim()
  if (!clerkPublishable || !clerkSecret) {
    events.push(
      classifyError({
        message: 'Clerk auth not configured. CLERK_SECRET_KEY or publishable key missing.',
        product: 'access_os',
        service: 'auth',
      }).event
    )
  }

  return events
}
