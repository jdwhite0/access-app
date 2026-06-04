import { createHmac, timingSafeEqual } from 'node:crypto'

/** Verify Slack request signature (Events API + slash commands). */
export function verifySlackSignature(input: {
  signingSecret: string
  signature: string | null
  timestamp: string | null
  rawBody: string
}): boolean {
  const { signingSecret, signature, timestamp, rawBody } = input
  if (!signature?.startsWith('v0=') || !timestamp) return false

  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 60 * 5) return false

  const base = `v0:${timestamp}:${rawBody}`
  const digest = `v0=${createHmac('sha256', signingSecret).update(base).digest('hex')}`

  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
  } catch {
    return false
  }
}

export function isAllowedSlackUser(userId: string | undefined): boolean {
  const allow = process.env.SLACK_ALLOWED_USER_IDS?.trim()
  if (!allow) return true
  const ids = allow.split(',').map((s) => s.trim()).filter(Boolean)
  return userId ? ids.includes(userId) : false
}
