'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { getIdentity } from '@/lib/actions/identity'
import { logEmailConsent } from '@/lib/email/consent'
import {
  applyMarketingOptInFromSignup,
  ensureEmailPreferences,
  updateEmailPreferences,
} from '@/lib/email/preferences-db'
import type { EmailPreferencesRow, UpdateEmailPreferencesInput } from '@/types/email'

export async function getEmailPreferencesAction(): Promise<{
  prefs: EmailPreferencesRow | null
  error?: string
}> {
  const identity = await getIdentity()
  if (!identity) return { prefs: null, error: 'Not signed in or identity missing.' }

  const prefs = await ensureEmailPreferences(identity.id)
  return { prefs }
}

export async function updateEmailPreferencesAction(
  patch: UpdateEmailPreferencesInput
): Promise<{ prefs: EmailPreferencesRow | null; error?: string }> {
  const { userId } = await auth()
  if (!userId) return { prefs: null, error: 'Not signed in.' }

  const identity = await getIdentity()
  if (!identity) return { prefs: null, error: 'Identity not found.' }

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  const hdrs = await headers()

  const result = await updateEmailPreferences(identity.id, patch)

  if (email && result.prefs) {
    await logEmailConsent({
      userId: identity.id,
      email,
      consentType: 'marketing_preferences_update',
      consentStatus: patch.marketing_paused ? 'withdrawn' : 'granted',
      source: 'settings/notifications-email',
      ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: hdrs.get('user-agent'),
    })
  }

  return result
}

/** Called from onboarding after identity is created — reads signup opt-in from client flag. */
export async function processSignupMarketingConsentAction(optIn: boolean): Promise<void> {
  const identity = await getIdentity()
  if (!identity) return

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return

  const hdrs = await headers()

  await applyMarketingOptInFromSignup(identity.id, optIn)
  await logEmailConsent({
    userId: identity.id,
    email,
    consentType: 'marketing_signup',
    consentStatus: optIn ? 'granted' : 'denied',
    source: 'sign-up',
    ipAddress: hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: hdrs.get('user-agent'),
  })
}
