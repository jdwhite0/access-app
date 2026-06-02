import { SignJWT, jwtVerify } from 'jose'
import { randomUUID } from 'node:crypto'
import type { ConnectorDeviceClaims, ConnectorPermission, VerifiedConnectorDevice } from './types'

const ISSUER = 'access-connector'
const AUDIENCE = 'access-cloud'
const DEFAULT_TTL_DAYS = 7

function getSecret(): Uint8Array | null {
  const raw = process.env.ACCESS_CONNECTOR_JWT_SECRET?.trim()
  if (!raw || raw.length < 32) return null
  return new TextEncoder().encode(raw)
}

export function isConnectorJwtConfigured(): boolean {
  return getSecret() !== null
}

export async function signConnectorDeviceToken(input: {
  deviceId: string
  identityId: string
  clerkUserId: string
  vaultConnectionId: string
  vaultKey: string
  permissions: ConnectorPermission[]
  ttlDays?: number
}): Promise<{ token: string; jti: string; expiresAt: Date } | null> {
  const secret = getSecret()
  if (!secret) return null

  const jti = randomUUID()
  const ttlDays = input.ttlDays ?? DEFAULT_TTL_DAYS
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)

  const token = await new SignJWT({
    identity_id: input.identityId,
    clerk_user_id: input.clerkUserId,
    vault_connection_id: input.vaultConnectionId,
    vault_key: input.vaultKey,
    permissions: input.permissions,
    jti,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.deviceId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret)

  return { token, jti, expiresAt }
}

export async function verifyConnectorDeviceToken(
  token: string
): Promise<{ ok: true; claims: VerifiedConnectorDevice } | { ok: false; error: string }> {
  const secret = getSecret()
  if (!secret) return { ok: false, error: 'Connector JWT secret not configured.' }

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
    })

    const sub = payload.sub
    if (!sub) return { ok: false, error: 'Invalid token subject.' }

    const identity_id = String(payload.identity_id ?? '')
    const clerk_user_id = String(payload.clerk_user_id ?? '')
    const vault_connection_id = String(payload.vault_connection_id ?? '')
    const vault_key = String(payload.vault_key ?? '')
    const jti = String(payload.jti ?? '')
    const permissions = (payload.permissions as ConnectorPermission[]) ?? []

    if (!identity_id || !clerk_user_id || !vault_connection_id || !jti) {
      return { ok: false, error: 'Token missing required claims.' }
    }

    return {
      ok: true,
      claims: {
        sub,
        identity_id,
        clerk_user_id,
        vault_connection_id,
        vault_key,
        permissions,
        jti,
        iat: payload.iat ?? 0,
        exp: payload.exp ?? 0,
      },
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid token.' }
  }
}
