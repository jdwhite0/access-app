'use server'

import { auth } from '@clerk/nextjs/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import {
  countVaultConnections,
  ensureVaultConnectionsForIdentity,
  fetchVaultConnectionSummary,
} from '@/lib/actions/vault-connection'
import { deriveSyncStatus } from '@/lib/vault/sync-status'
import type { RegistryCounts, RegistrySummary } from '@/types/db'

function emptySummary(ownerHandle: string): RegistrySummary {
  const counts: RegistryCounts = {
    systems: 0,
    agents: 0,
    projects: 0,
    blueprints: 0,
    assets: 0,
    workflows: 0,
    vaults: 0,
    connections: 0,
    offers: 0,
  }
  return {
    identityHandle: ownerHandle,
    identityCreatedAt: null,
    registryCounts: counts,
    counts,
    totalRegistered: 0,
    connectionsCount: 0,
    vaultConnection: null,
    syncStatus: null,
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
  let connectionsCount = 0

  if (identity) {
    await ensureVaultConnectionsForIdentity(supabase, identity)

    const { data: rpcSummary, error: rpcError } = await supabase.rpc(
      'get_registry_summary',
      { p_identity_id: identity.id }
    )

    if (!rpcError && rpcSummary && typeof rpcSummary === 'object') {
      const s = rpcSummary as Record<string, unknown>
      const counts = (s.registryCounts ?? s.counts) as RegistryCounts
      const vault = s.vaultConnection as RegistrySummary['vaultConnection']
      return {
        identityHandle: String(s.identityHandle ?? identity.handle),
        identityCreatedAt: (s.identityCreatedAt as string) ?? identity.created_at,
        registryCounts: counts,
        counts,
        totalRegistered: Object.values(counts).reduce((a, b) => a + b, 0),
        connectionsCount: Number(s.connectionsCount ?? counts.connections ?? 0),
        vaultConnection: vault ?? null,
        syncStatus: (s.syncStatus as string) ?? deriveSyncStatus(vault ?? null),
      }
    }

    vaultConnection = await fetchVaultConnectionSummary(supabase, userId)
    connectionsCount = await countVaultConnections(supabase, userId)
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

  const registryCounts: RegistryCounts = {
    systems: systems.count ?? 0,
    agents: agents.count ?? 0,
    projects: projects.count ?? 0,
    blueprints: blueprints.count ?? 0,
    assets: assets.count ?? 0,
    workflows: workflows.count ?? 0,
    vaults: vaults.count ?? 0,
    connections: connectionsCount,
    offers: offers.count ?? 0,
  }

  const totalRegistered = Object.values(registryCounts).reduce((a, b) => a + b, 0)
  const syncStatus = deriveSyncStatus(vaultConnection)

  return {
    identityHandle: identity?.handle ?? ownerHandle,
    identityCreatedAt: identity?.created_at ?? null,
    registryCounts,
    counts: registryCounts,
    totalRegistered,
    connectionsCount,
    vaultConnection,
    syncStatus,
  }
}
