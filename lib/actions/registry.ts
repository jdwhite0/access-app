'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import {
  countVaultConnections,
  ensureJdAiSystemVaultConnection,
  fetchVaultConnectionSummary,
} from '@/lib/actions/vault-connection'
import type { RegistrySummary } from '@/types/db'

function emptySummary(ownerHandle: string): RegistrySummary {
  return {
    identityHandle: ownerHandle,
    identityCreatedAt: null,
    counts: {
      systems: 0,
      agents: 0,
      projects: 0,
      blueprints: 0,
      assets: 0,
      workflows: 0,
      vaults: 0,
      connections: 0,
      offers: 0,
    },
    totalRegistered: 0,
    vaultConnection: null,
  }
}

export async function getRegistrySummary(ownerHandle: string): Promise<RegistrySummary> {
  const { userId } = await auth()
  if (!userId) return emptySummary(ownerHandle)

  const supabase = createSupabaseAdmin()
  if (!supabase) return emptySummary(ownerHandle)

  const { data: identity } = await supabase
    .from('access_identities')
    .select('id, clerk_user_id, handle, created_at')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  let vaultConnection = null
  let connectionCount = 0

  if (identity) {
    await ensureJdAiSystemVaultConnection(supabase, identity)
    vaultConnection = await fetchVaultConnectionSummary(supabase, userId)
    connectionCount = await countVaultConnections(supabase, userId)
  }

  const [systems, agents, projects, blueprints, assets, workflows, vaults, offers] =
    await Promise.all([
      supabase.from('systems').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId).eq('status', 'active'),
      supabase.from('agents').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId).eq('status', 'active'),
      supabase.from('builder_projects').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId).neq('status', 'archived'),
      supabase.from('blueprints').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId),
      supabase.from('assets').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId).eq('status', 'active'),
      supabase.from('workflows').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId).eq('status', 'active'),
      supabase.from('vaults').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId).eq('status', 'active'),
      supabase.from('offers').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId).neq('status', 'archived'),
    ])

  const counts = {
    systems: systems.count ?? 0,
    agents: agents.count ?? 0,
    projects: projects.count ?? 0,
    blueprints: blueprints.count ?? 0,
    assets: assets.count ?? 0,
    workflows: workflows.count ?? 0,
    vaults: vaults.count ?? 0,
    connections: connectionCount,
    offers: offers.count ?? 0,
  }

  const totalRegistered = Object.values(counts).reduce((a, b) => a + b, 0)

  return {
    identityHandle: identity?.handle ?? ownerHandle,
    identityCreatedAt: identity?.created_at ?? null,
    counts,
    totalRegistered,
    vaultConnection,
  }
}
