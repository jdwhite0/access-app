import type { AccessConnectorConfig } from './types.js'
import { connectorFetch, loadDeviceToken } from './api-client.js'
import { runScan } from './scan.js'
import { resolveVaultPath } from './vault-mirror-paths.js'

export type PostMirrorResyncReport = {
  ok: boolean
  error: string | null
  scan: {
    fileCount: number
    truncated: boolean
    outputPath: string | null
  } | null
  cloud: {
    ok: boolean
    file_count?: number
    last_synced_at?: string
    error?: string
  } | null
}

/** Re-scan vault and push counts to ACCESS (mirrors requestVaultSync outcomes). */
export async function runPostMirrorVaultResync(
  _config: AccessConnectorConfig,
  options?: { vaultPath?: string },
): Promise<PostMirrorResyncReport> {
  const vaultPath = resolveVaultPath(options?.vaultPath)
  const prevRoot = process.env.ACCESS_VAULT_ROOT
  process.env.ACCESS_VAULT_ROOT = vaultPath

  try {
    const scanReport = await runScan(_config)
    const scan = scanReport.ok
      ? {
          fileCount: scanReport.summary?.fileCount ?? 0,
          truncated: scanReport.summary?.truncated ?? false,
          outputPath: scanReport.outputPath,
        }
      : null

    if (!scanReport.ok) {
      return {
        ok: false,
        error: scanReport.error ?? 'Vault scan failed after mirror',
        scan: null,
        cloud: null,
      }
    }

    const token = loadDeviceToken()
    if (!token) {
      return {
        ok: true,
        error: null,
        scan,
        cloud: {
          ok: false,
          error: 'No device token — local scan only. Pair connector to update cloud vault status.',
        },
      }
    }

    let res: Response
    try {
      res = await connectorFetch('/api/connector/v1/vault/resync', {
        method: 'POST',
        token,
        body: {
          fileCount: scan?.fileCount,
          truncated: scan?.truncated,
          localPath: vaultPath,
        },
      })
    } catch (err) {
      return {
        ok: true,
        error: null,
        scan,
        cloud: {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        },
      }
    }

    const json = (await res.json()) as {
      ok?: boolean
      file_count?: number
      last_synced_at?: string
      error?: string
    }

    if (!res.ok || !json.ok) {
      return {
        ok: true,
        error: null,
        scan,
        cloud: {
          ok: false,
          error: json.error ?? `Cloud resync failed (${res.status})`,
        },
      }
    }

    return {
      ok: true,
      error: null,
      scan,
      cloud: {
        ok: true,
        file_count: json.file_count,
        last_synced_at: json.last_synced_at,
      },
    }
  } finally {
    if (prevRoot === undefined) delete process.env.ACCESS_VAULT_ROOT
    else process.env.ACCESS_VAULT_ROOT = prevRoot
  }
}
