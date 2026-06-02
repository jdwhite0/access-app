'use server'

import { auth } from '@clerk/nextjs/server'
import { randomBytes } from 'node:crypto'
import { createSupabaseAdmin } from '@/lib/supabase'

const PAIRING_TTL_MINUTES = 10

function generatePairingCode(): string {
  return randomBytes(3).toString('hex').toUpperCase()
}

export async function createConnectorPairingCode(input?: {
  vaultConnectionId?: string
}): Promise<
  | { ok: true; code: string; expiresAt: string; vaultConnectionId: string | null }
  | { ok: false; error: string }
> {
  const { userId } = await auth()
  if (!userId) return { ok: false, error: 'Not signed in.' }

  const supabase = createSupabaseAdmin()
  if (!supabase) return { ok: false, error: 'Database not configured.' }

  const { data: identity } = await supabase
    .from('access_identities')
    .select('id, clerk_user_id')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (!identity) return { ok: false, error: 'ACCESS identity not found.' }

  let vaultConnectionId = input?.vaultConnectionId ?? null
  if (!vaultConnectionId) {
    const { data: vault } = await supabase
      .from('vault_connections')
      .select('id')
      .eq('identity_id', identity.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    vaultConnectionId = vault?.id ?? null
  }

  const code = generatePairingCode()
  const expiresAt = new Date(Date.now() + PAIRING_TTL_MINUTES * 60 * 1000).toISOString()

  const { error } = await supabase.from('connector_pairing_codes').insert({
    code,
    identity_id: identity.id,
    clerk_user_id: identity.clerk_user_id,
    vault_connection_id: vaultConnectionId,
    created_by_clerk: userId,
    expires_at: expiresAt,
  })

  if (error) return { ok: false, error: error.message }

  return { ok: true, code, expiresAt, vaultConnectionId }
}
