import { connectorFetch, loadDeviceToken } from './api-client.js'

export async function runHeartbeat(): Promise<{ ok: boolean; error: string | null }> {
  const token = loadDeviceToken()
  if (!token) return { ok: false, error: 'No device token.' }

  const res = await connectorFetch('/api/connector/v1/heartbeat', {
    method: 'POST',
    token,
  })

  const json = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
    at?: string
  }

  if (!res.ok || json.ok === false) {
    return { ok: false, error: json.error ?? `Heartbeat failed (${res.status})` }
  }

  if (!json.at) {
    return {
      ok: false,
      error:
        'Invalid heartbeat response. Start access-app with `npm run dev` and set ACCESS_API_BASE_URL=http://localhost:3000.',
    }
  }

  return { ok: true, error: null }
}
