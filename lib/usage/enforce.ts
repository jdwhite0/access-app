'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export type UsageEventType =
  | 'jyson_message'
  | 'tool_execute'
  | 'registry_write'

const PLAN_LIMITS: Record<string, { jyson_messages_mo: number | null; registry_objects: number | null }> = {
  founder:    { jyson_messages_mo: null, registry_objects: null },
  builder:    { jyson_messages_mo: null, registry_objects: null },
  operator:   { jyson_messages_mo: null, registry_objects: 25 },
  free:       { jyson_messages_mo: 50,   registry_objects: 5 },
}

/**
 * Record a usage event for the current user.
 * Fails silently — never blocks the main request on a tracking failure.
 */
export async function recordUsageEvent(
  eventType: UsageEventType,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { userId } = await auth()
    if (!userId) return

    const supabase = createSupabaseAdmin()
    if (!supabase) return

    const { data: identity } = await supabase
      .from('access_identities')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (!identity) return

    await supabase.from('usage_events').insert({
      identity_id: identity.id,
      clerk_user_id: userId,
      event_type: eventType,
      metadata,
    })
  } catch {
    // Never throw — usage tracking must never break the main flow
  }
}

/**
 * Check if the current user is within their plan limits.
 * Returns { allowed: true } if within limits, or { allowed: false, reason, upgradeHref }.
 */
export async function checkUsageLimit(
  eventType: UsageEventType
): Promise<{ allowed: true } | { allowed: false; reason: string; upgradeHref: string }> {
  try {
    const { userId } = await auth()
    if (!userId) return { allowed: false, reason: 'Not signed in.', upgradeHref: '/' }

    const supabase = createSupabaseAdmin()
    if (!supabase) return { allowed: true } // fail open when DB is unavailable

    const { data: identity } = await supabase
      .from('access_identities')
      .select('id, plan')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (!identity) return { allowed: true }

    const plan = (identity.plan as string) ?? 'free'
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free

    // Check jyson_message limit
    if (eventType === 'jyson_message' && limits.jyson_messages_mo !== null) {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from('usage_events')
        .select('id', { count: 'exact', head: true })
        .eq('identity_id', identity.id)
        .eq('event_type', 'jyson_message')
        .gte('created_at', startOfMonth.toISOString())

      if ((count ?? 0) >= limits.jyson_messages_mo) {
        return {
          allowed: false,
          reason: `You've used all ${limits.jyson_messages_mo} JYSON messages included in the free plan this month.`,
          upgradeHref: '/plans',
        }
      }
    }

    // Check registry_write limit
    if (eventType === 'registry_write' && limits.registry_objects !== null) {
      const { count } = await supabase
        .from('usage_events')
        .select('id', { count: 'exact', head: true })
        .eq('identity_id', identity.id)
        .eq('event_type', 'registry_write')

      if ((count ?? 0) >= limits.registry_objects) {
        return {
          allowed: false,
          reason: `You've reached the ${limits.registry_objects}-object registry limit for the free plan.`,
          upgradeHref: '/plans',
        }
      }
    }

    return { allowed: true }
  } catch {
    return { allowed: true } // fail open
  }
}
