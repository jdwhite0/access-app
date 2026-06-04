import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getIdentity } from '@/lib/actions/identity'
import { ensureEmailPreferences, updateEmailPreferences } from '@/lib/email/preferences-db'
import { logEmailConsent } from '@/lib/email/consent'
import type { UpdateEmailPreferencesInput } from '@/types/email'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const identity = await getIdentity()
  if (!identity) return NextResponse.json({ error: 'Identity not found' }, { status: 404 })

  const prefs = await ensureEmailPreferences(identity.id)
  return NextResponse.json({ preferences: prefs })
}

export async function PATCH(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const identity = await getIdentity()
  if (!identity) return NextResponse.json({ error: 'Identity not found' }, { status: 404 })

  let body: UpdateEmailPreferencesInput
  try {
    body = (await request.json()) as UpdateEmailPreferencesInput
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = await updateEmailPreferences(identity.id, body)
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (email) {
    await logEmailConsent({
      userId: identity.id,
      email,
      consentType: 'marketing_preferences_update',
      consentStatus: body.marketing_paused ? 'withdrawn' : 'granted',
      source: 'api/email/preferences',
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    })
  }

  return NextResponse.json({ preferences: result.prefs })
}
