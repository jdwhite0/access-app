import type { AccessConnectorConfig } from './types.js'
import { connectorFetch, saveDeviceAuth } from './api-client.js'

export async function runRegister(
  config: AccessConnectorConfig,
  input: { pairingCode: string; deviceName?: string }
): Promise<{ ok: boolean; error: string | null }> {
  const res = await connectorFetch('/api/connector/v1/devices/register', {
    method: 'POST',
    body: {
      pairingCode: input.pairingCode.trim(),
      deviceName: input.deviceName ?? `ACCESS Connector (${config.identityHandle})`,
      machineId: config.machineId ?? process.env.ACCESS_CONNECTOR_MACHINE_ID,
    },
  })

  const json = (await res.json()) as {
    ok?: boolean
    error?: string
    deviceId?: string
    token?: string
    expiresAt?: string
    permissions?: string[]
  }

  if (!res.ok || !json.ok || !json.token || !json.deviceId) {
    return { ok: false, error: json.error ?? `Register failed (${res.status})` }
  }

  saveDeviceAuth({
    deviceId: json.deviceId,
    token: json.token,
    expiresAt: json.expiresAt ?? '',
    permissions: json.permissions ?? [],
  })

  return { ok: true, error: null }
}
