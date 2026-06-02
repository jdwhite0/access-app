import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { AccessConnectorConfig, RegistrySyncPlan } from './types.js'
import { connectorFetch, loadDeviceToken } from './api-client.js'
import { runSyncPlan } from './sync-plan.js'

export async function runSyncApply(
  config: AccessConnectorConfig,
  options?: { planPath?: string }
): Promise<{ ok: boolean; error: string | null; report: unknown }> {
  const token = loadDeviceToken()
  if (!token) {
    return {
      ok: false,
      error: 'No device token. Run: npm run register -- <PAIRING_CODE>',
      report: null,
    }
  }

  const planPath = options?.planPath ?? resolve(process.cwd(), 'registry-sync-plan.json')
  let plan: RegistrySyncPlan | Record<string, unknown>

  if (existsSync(planPath)) {
    plan = JSON.parse(readFileSync(planPath, 'utf8')) as RegistrySyncPlan
  } else {
    const built = await runSyncPlan(config)
    if ('ok' in built && built.ok === false) {
      return { ok: false, error: built.error, report: null }
    }
    plan = built as RegistrySyncPlan
  }

  const payload = {
    ...plan,
    applyToCloud: true,
    vaultKey: config.vaultKey,
    identityHandle: config.identityHandle,
  }

  const res = await connectorFetch('/api/connector/v1/sync/apply', {
    method: 'POST',
    token,
    body: payload,
  })

  const report = await res.json()
  if (!res.ok) {
    return {
      ok: false,
      error: (report as { error?: string }).error ?? `Apply failed (${res.status})`,
      report,
    }
  }

  return {
    ok: !!(report as { ok?: boolean }).ok,
    error: null,
    report,
  }
}
