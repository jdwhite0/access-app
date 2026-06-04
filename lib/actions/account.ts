'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'

/**
 * Permanently deletes the current user's account.
 * Removes all Supabase data then deletes the Clerk user.
 * Called from AccountPageClient — user must confirm their handle before this fires.
 */
export async function deleteAccountAction(): Promise<void> {
  const { userId } = await auth()
  if (!userId) throw new Error('Not signed in.')

  const supabase = createSupabaseAdmin()
  if (supabase) {
    // Delete all user-owned registry objects (cascade handles children)
    const tables = [
      'builder_projects',
      'offers',
      'agents',
      'assets',
      'workflows',
      'vaults',
      'systems',
      'blueprints',
      'connector_devices',
      'vault_connections',
    ] as const

    await Promise.allSettled(
      tables.map(table =>
        supabase.from(table).delete().eq('clerk_user_id', userId)
      )
    )

    const { data: identity } = await supabase
      .from('access_identities')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (identity?.id) {
      await supabase.from('email_preferences').delete().eq('user_id', identity.id)
      await supabase.from('email_consent_log').delete().eq('user_id', identity.id)
      await supabase.from('email_unsubscribe_events').delete().eq('user_id', identity.id)
    }

    // Delete identity last (it anchors other records)
    await supabase.from('access_identities').delete().eq('clerk_user_id', userId)
    await supabase.from('profiles').delete().eq('clerk_user_id', userId)
  }

  // Delete the Clerk user — terminates all sessions
  const client = await clerkClient()
  await client.users.deleteUser(userId)
}
