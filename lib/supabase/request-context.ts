import type { SupabaseClient } from '@supabase/supabase-js'

export async function setSupabaseRequestContext(
  supabase: SupabaseClient,
  identityId: string,
  clerkUserId: string
): Promise<void> {
  await supabase.rpc('access_set_request_context', {
    p_identity_id: identityId,
    p_clerk_user_id: clerkUserId,
  })
}
