'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe/client'

const FOUNDER_HANDLES = ['jdwhite']

async function assertFounder(): Promise<{ userId: string } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not signed in.' }

  const supabase = createSupabaseAdmin()
  if (!supabase) return { error: 'Database unavailable.' }

  const { data } = await supabase
    .from('access_identities')
    .select('plan, handle')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  const handle = (data?.handle as string | null) ?? ''
  const username = handle.replace('.access', '').toLowerCase()
  const plan = (data?.plan as string) ?? 'free'

  const isFounder = plan === 'founder' || FOUNDER_HANDLES.includes(username)
  if (!isFounder) return { error: 'Not authorized.' }

  return { userId }
}

export async function updateUserPlan(
  identityId: string,
  newPlan: string
): Promise<{ success: true } | { error: string }> {
  const check = await assertFounder()
  if ('error' in check) return check

  const supabase = createSupabaseAdmin()
  if (!supabase) return { error: 'Database unavailable.' }

  const { error } = await supabase
    .from('access_identities')
    .update({ plan: newPlan })
    .eq('id', identityId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function suspendUser(
  identityId: string
): Promise<{ success: true } | { error: string }> {
  const check = await assertFounder()
  if ('error' in check) return check

  const supabase = createSupabaseAdmin()
  if (!supabase) return { error: 'Database unavailable.' }

  const { error } = await supabase
    .from('access_identities')
    .update({ plan: 'suspended' })
    .eq('id', identityId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function restoreUser(
  identityId: string
): Promise<{ success: true } | { error: string }> {
  const check = await assertFounder()
  if ('error' in check) return check

  const supabase = createSupabaseAdmin()
  if (!supabase) return { error: 'Database unavailable.' }

  const { error } = await supabase
    .from('access_identities')
    .update({ plan: 'free' })
    .eq('id', identityId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function applyAdminCoupon(
  stripeCustomerId: string,
  couponId: string
): Promise<{ success: true } | { error: string }> {
  const check = await assertFounder()
  if ('error' in check) return check

  if (!stripe) return { error: 'Stripe not configured.' }

  try {
    // Apply coupon to the customer's active subscription
    const subs = await stripe.subscriptions.list({ customer: stripeCustomerId, status: 'active', limit: 1 })
    if (subs.data.length === 0) return { error: 'No active subscription found for this customer.' }
    await stripe.subscriptions.update(subs.data[0].id, { discounts: [{ coupon: couponId }] })
    return { success: true }
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Stripe error.' }
  }
}

export async function deleteUserAccount(
  identityId: string,
  clerkUserId: string
): Promise<{ success: true } | { error: string }> {
  const check = await assertFounder()
  if ('error' in check) return check

  const supabase = createSupabaseAdmin()
  if (!supabase) return { error: 'Database unavailable.' }

  // Cascade: delete usage events, then identity
  await supabase.from('usage_events').delete().eq('identity_id', identityId)
  const { error } = await supabase.from('access_identities').delete().eq('id', identityId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function getSystemStatus(): Promise<{
  supabaseOk: boolean
  stripeOk: boolean
  userCount: number
  paidCount: number
  mrrEstimate: number
}> {
  const supabase = createSupabaseAdmin()
  let supabaseOk = false
  let userCount = 0
  let paidCount = 0
  let mrrEstimate = 0

  if (supabase) {
    const { data, error } = await supabase
      .from('access_identities')
      .select('plan')

    if (!error && data) {
      supabaseOk = true
      userCount = data.length
      paidCount = data.filter((d) => d.plan === 'builder' || d.plan === 'operator').length
      mrrEstimate = data.reduce((sum, d) => {
        if (d.plan === 'builder') return sum + 599
        if (d.plan === 'operator') return sum + 299
        return sum
      }, 0)
    }
  }

  let stripeOk = false
  if (stripe) {
    try {
      await stripe.balance.retrieve()
      stripeOk = true
    } catch {}
  }

  return { supabaseOk, stripeOk, userCount, paidCount, mrrEstimate }
}
