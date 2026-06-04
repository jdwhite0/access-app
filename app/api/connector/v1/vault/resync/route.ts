import type { NextRequest } from 'next/server'
import { authenticateConnectorRequest } from '@/lib/connector-auth/middleware'
import { createSupabaseAdmin } from '@/lib/supabase'
import { applyConnectorVaultResync } from '@/lib/vault/connector-vault-resync'
import { classifiedErrorResponse, jsonError, jsonOk } from '@/lib/api/connector-response'

export async function POST(req: NextRequest) {
  const auth = await authenticateConnectorRequest(req, 'heartbeat')
  if (!auth.ok) {
    return classifiedErrorResponse(
      { error: new Error(`Unauthorized: ${auth.error}`), httpStatus: auth.status, product: 'access_os', service: 'auth' },
      { httpStatus: auth.status },
    )
  }

  const supabase = createSupabaseAdmin()
  if (!supabase) {
    return classifiedErrorResponse({
      message: 'Database not configured.',
      product: 'access_os',
      service: 'database',
    })
  }

  let body: { fileCount?: number; truncated?: boolean; localPath?: string } = {}
  try {
    body = (await req.json()) as typeof body
  } catch {
    /* empty body — server will scan */
  }

  const result = await applyConnectorVaultResync(supabase, {
    clerkUserId: auth.device.clerk_user_id,
    fileCount: typeof body.fileCount === 'number' ? body.fileCount : undefined,
    truncated: body.truncated,
    localPath: body.localPath,
  })

  if (!result.ok) {
    return jsonError(result.error ?? 'Vault resync failed', 400)
  }

  return jsonOk({
    ok: true,
    file_count: result.fileCount,
    last_synced_at: result.lastSyncedAt,
    vaults_updated: result.vaultsUpdated,
    vault_connections_updated: result.vaultConnectionsUpdated,
    note: result.error,
  })
}
