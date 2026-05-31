'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { BuilderProject, Task, Milestone } from '@/types/db'

export interface CreateProjectInput {
  name: string
  objective?: string
  systemId?: string
  ownerHandle: string
  milestones?: Milestone[]
  tasks?: Task[]
  stack?: string[]
  assets?: string[]
  architecture?: string
}

export async function createBuilderProject(input: CreateProjectInput): Promise<BuilderProject | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return {
      id: `local-${Date.now()}`,
      clerk_user_id: userId,
      owner_handle: input.ownerHandle,
      system_id: input.systemId ?? null,
      name: input.name,
      objective: input.objective ?? null,
      status: 'active',
      milestones: input.milestones ?? [],
      tasks: input.tasks ?? [],
      stack: input.stack ?? [],
      assets: input.assets ?? [],
      architecture: input.architecture ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('builder_projects')
    .insert({
      clerk_user_id: userId,
      owner_handle: input.ownerHandle,
      system_id: input.systemId ?? null,
      name: input.name,
      objective: input.objective ?? null,
      status: 'active',
      milestones: input.milestones ?? [],
      tasks: input.tasks ?? [],
      stack: input.stack ?? [],
      assets: input.assets ?? [],
      architecture: input.architecture ?? null,
    })
    .select('*')
    .single()

  if (error) return null
  return data as BuilderProject
}

export async function listBuilderProjects(): Promise<BuilderProject[]> {
  const { userId } = await auth()
  if (!userId) return []

  const supabase = createSupabaseAdmin()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('builder_projects')
    .select('*')
    .eq('clerk_user_id', userId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return []
  return (data ?? []) as BuilderProject[]
}

export async function getBuilderProject(projectId: string): Promise<BuilderProject | null> {
  const { userId } = await auth()
  if (!userId) return null

  const supabase = createSupabaseAdmin()
  if (!supabase) return null

  const { data } = await supabase
    .from('builder_projects')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('id', projectId)
    .single()

  return (data ?? null) as BuilderProject | null
}

export async function updateProjectTasks(projectId: string, tasks: Task[]): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const supabase = createSupabaseAdmin()
  if (!supabase) return false

  const { error } = await supabase
    .from('builder_projects')
    .update({ tasks, updated_at: new Date().toISOString() })
    .eq('clerk_user_id', userId)
    .eq('id', projectId)

  return !error
}

export async function updateProjectMilestones(projectId: string, milestones: Milestone[]): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const supabase = createSupabaseAdmin()
  if (!supabase) return false

  const { error } = await supabase
    .from('builder_projects')
    .update({ milestones, updated_at: new Date().toISOString() })
    .eq('clerk_user_id', userId)
    .eq('id', projectId)

  return !error
}

export async function archiveBuilderProject(projectId: string): Promise<boolean> {
  const { userId } = await auth()
  if (!userId) return false

  const supabase = createSupabaseAdmin()
  if (!supabase) return false

  const { error } = await supabase
    .from('builder_projects')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('clerk_user_id', userId)
    .eq('id', projectId)

  return !error
}
