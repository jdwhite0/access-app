import { connectorFetch, loadDeviceToken } from './api-client.js'

export async function runHeartbeat(): Promise<{ ok: boolean; error: string | null }> {
  const token = loadDeviceToken()
  if (!token) return { ok: false, error: 'No device token.' }

  const res = await connectorFetch('/api/connector/v1/heartbeat', {
    method: 'POST',
    token,
  })

  if (!res.ok) {
    const json = (await res.json()) as { error?: string }
    return { ok: false, error: json.error ?? `Heartbeat failed (${res.status})` }
  }

  return { ok: true, error: null }
}
