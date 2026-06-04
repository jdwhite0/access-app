import { createHmac, timingSafeEqual } from 'crypto'
import type { UnsubscribeCategory } from '@/lib/email/constants'
import { getAppBaseUrl } from '@/lib/email/constants'

const TOKEN_TTL_DAYS = 365

type UnsubscribePayload = {
  email: string
  category: UnsubscribeCategory
  exp: number
}

function getSecret(): string | null {
  const s = process.env.EMAIL_UNSUBSCRIBE_SECRET?.trim()
  return s && s.length >= 16 ? s : null
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url')
}

export function createUnsubscribeToken(input: {
  email: string
  category: UnsubscribeCategory
}): string | null {
  const secret = getSecret()
  if (!secret) return null

  const payload: UnsubscribePayload = {
    email: input.email.toLowerCase().trim(),
    category: input.category,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_DAYS * 86400,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = sign(body, secret)
  return `${body}.${sig}`
}

export function parseUnsubscribeToken(token: string): UnsubscribePayload | null {
  const secret = getSecret()
  if (!secret) return null

  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = sign(body, secret)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as UnsubscribePayload
    if (!payload.email || !payload.category || !payload.exp) return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function buildUnsubscribeUrl(token: string): string {
  return `${getAppBaseUrl()}/unsubscribe?token=${encodeURIComponent(token)}`
}
