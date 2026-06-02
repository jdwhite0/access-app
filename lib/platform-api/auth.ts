import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export function verifyInternalKey(request: NextRequest): NextResponse | null {
  const key = request.headers.get('x-access-internal-key')
  const expected = process.env.ACCESS_INTERNAL_KEY

  if (expected && key !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (!expected && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { ok: false, error: 'ACCESS_INTERNAL_KEY required in production' },
      { status: 503 }
    )
  }
  return null
}

export async function requireClerkOperator(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const { userId } = await auth()
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'Sign in required' }, { status: 401 }),
    }
  }
  return { ok: true, userId }
}

function engineeringAllowed(userId: string, email: string | undefined): boolean {
  const list = process.env.ACCESS_PLATFORM_ENGINEERING_EMAILS?.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  if (list?.length && email) {
    return list.includes(email.toLowerCase())
  }
  // Dev default: any signed-in operator can open developer view locally
  if (process.env.NODE_ENV !== 'production') return true
  return process.env.ACCESS_PLATFORM_ENGINEERING_OPEN === 'true'
}

export async function requireClerkEngineering(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'Sign in required' }, { status: 401 }),
    }
  }
  const meta = sessionClaims?.metadata as { engineering?: boolean } | undefined
  if (meta?.engineering === true) {
    return { ok: true, userId }
  }
  const email =
    (sessionClaims as { email?: string } | undefined)?.email ??
    (sessionClaims as { primary_email?: string } | undefined)?.primary_email
  if (engineeringAllowed(userId, email)) {
    return { ok: true, userId }
  }
  return {
    ok: false,
    response: NextResponse.json(
      { ok: false, error: 'Engineering access required' },
      { status: 403 }
    ),
  }
}
