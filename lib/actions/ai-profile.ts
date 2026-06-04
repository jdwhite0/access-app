'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export type AIProfile = {
  id: string
  clerk_user_id: string
  identity_id: string | null
  ai_name: string
  ai_role: string
  ai_tone: string
  ai_purpose: string
  onboarding_completed: boolean
  onboarding_answers: Record<string, string> | null
  created_at: string
  updated_at: string
}

const DEFAULTS = {
  ai_name: 'JYSON',
  ai_role: 'AI operator',
  ai_tone: 'strategic, clear, direct',
  ai_purpose: 'help you turn ideas, assets, knowledge, and work into systems that compound',
} as const

export async function getAIProfile(): Promise<{ profile: AIProfile } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not signed in.' }

  const supabase = createSupabaseAdmin()
  if (!supabase) return {
    profile: {
      id: 'local',
      clerk_user_id: userId,
      identity_id: null,
      ...DEFAULTS,
      onboarding_completed: false,
      onboarding_answers: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('user_ai_profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') return { error: error.message }

  if (!data) {
    // Auto-create with defaults on first access
    const { data: created, error: createErr } = await supabase
      .from('user_ai_profiles')
      .insert({
        clerk_user_id: userId,
        ...DEFAULTS,
        onboarding_completed: false,
        onboarding_answers: null,
      })
      .select()
      .single()

    if (createErr) return { error: createErr.message }
    return { profile: created as AIProfile }
  }

  return { profile: data as AIProfile }
}

export async function updateAIProfile(updates: {
  ai_name?: string
  ai_role?: string
  ai_tone?: string
  ai_purpose?: string
  onboarding_completed?: boolean
  onboarding_answers?: Record<string, string>
}): Promise<{ success: true } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not signed in.' }

  const supabase = createSupabaseAdmin()
  if (!supabase) return { success: true } // graceful degradation

  // Upsert — handles first-time creation and updates
  const { error } = await supabase
    .from('user_ai_profiles')
    .upsert({
      clerk_user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'clerk_user_id' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function completeOnboarding(answers: Record<string, string>): Promise<{ success: true } | { error: string }> {
  const { userId } = await auth()
  if (!userId) return { error: 'Not signed in.' }

  const supabase = createSupabaseAdmin()
  if (!supabase) return { success: true }

  // Build a personalized ai_purpose from onboarding answers
  const what = answers['what_building'] ?? ''
  const sell = answers['what_sell'] ?? ''
  const goals = answers['goals'] ?? ''
  const aiHelp = answers['ai_help'] ?? DEFAULTS.ai_purpose
  const aiName = answers['ai_name'] ?? DEFAULTS.ai_name

  const ai_purpose = aiHelp || (
    [what && `help with ${what}`, sell && `grow ${sell}`, goals && `achieve ${goals}`]
      .filter(Boolean)
      .join(', ') || DEFAULTS.ai_purpose
  )

  const { error } = await supabase
    .from('user_ai_profiles')
    .upsert({
      clerk_user_id: userId,
      ai_name: aiName,
      ai_role: DEFAULTS.ai_role,
      ai_tone: DEFAULTS.ai_tone,
      ai_purpose,
      onboarding_completed: true,
      onboarding_answers: answers,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'clerk_user_id' })

  if (error) return { error: error.message }
  return { success: true }
}
