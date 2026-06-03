'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export type IdentityPlanData = {
  plan: string
  stripe_customer_id: string | null
}

export async function getIdentityPlan(): Promise<
  { data: IdentityPlanData } | { error: string }
> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not signed in.' }

  const supabase = createSupabaseAdmin()
  if (!supabase) return { data: { plan: 'free', stripe_customer_id: null } }

  const { data, error } = await supabase
    .from('access_identities')
    .select('plan, stripe_customer_id')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (error || !data) return { data: { plan: 'free', stripe_customer_id: null } }

  return {
    data: {
      plan: (data.plan as string) ?? 'free',
      stripe_customer_id: (data.stripe_customer_id as string | null) ?? null,
    },
  }
}
