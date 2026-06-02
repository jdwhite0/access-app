import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function getApiBaseUrl(): string {
  const fromEnv = process.env.ACCESS_API_BASE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'http://localhost:3000'
}

export async function connectorFetch(
  path: string,
  options: {
    method?: string
    token?: string | null
    body?: unknown
  } = {}
): Promise<Response> {
  const token = options.token ?? loadDeviceToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  return fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}

const TOKEN_FILE = '.access-connector-token.json'

export type StoredDeviceAuth = {
  deviceId: string
  token: string
  expiresAt: string
  permissions: string[]
}

export function tokenFilePath(): string {
  return resolve(process.cwd(), TOKEN_FILE)
}

export function loadDeviceToken(): string | null {
  const path = tokenFilePath()
  if (!existsSync(path)) return null
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as StoredDeviceAuth
    return raw.token ?? null
  } catch {
    return null
  }
}

export function saveDeviceAuth(auth: StoredDeviceAuth): void {
  writeFileSync(tokenFilePath(), JSON.stringify(auth, null, 2), 'utf8')
}
