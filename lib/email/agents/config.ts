/**
 * Email agent configuration — founder test mode, provider, batch settings.
 */

export function isEmailTestMode(): boolean {
  return process.env.EMAIL_TEST_MODE?.trim().toLowerCase() === 'true'
}

export function getFounderTestUserId(): string | null {
  return process.env.FOUNDER_TEST_USER_ID?.trim() || null
}

export function getFounderTestEmail(): string | null {
  return process.env.FOUNDER_TEST_EMAIL?.trim() || null
}

export function getEmailProviderName(): string {
  return process.env.EMAIL_PROVIDER_NAME?.trim() || 'resend'
}

export function getEmailFromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.EMAIL_FROM_ADDRESS?.trim() ||
    'ACCESS <notifications@access.jd.ai>'
  )
}

export function getInternalEmailApiSecret(): string | null {
  return process.env.INTERNAL_EMAIL_API_SECRET?.trim() || null
}

export function assertInternalEmailAuth(headerSecret: string | null): boolean {
  const expected = getInternalEmailApiSecret()
  if (!expected) {
    // Dev: allow when secret not configured (log-only mode)
    return process.env.NODE_ENV !== 'production'
  }
  return headerSecret === expected
}

/** Returns true if this recipient should receive in test mode. */
export function isFounderTestRecipient(userId: string | null, email: string): boolean {
  if (!isEmailTestMode()) return true

  const founderId = getFounderTestUserId()
  const founderEmail = getFounderTestEmail()?.toLowerCase()

  if (founderId && userId === founderId) return true
  if (founderEmail && email.toLowerCase() === founderEmail) return true
  return false
}
